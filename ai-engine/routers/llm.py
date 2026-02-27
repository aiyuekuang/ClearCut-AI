"""LLM Proxy - forwards chat completion requests to external LLM providers.

Electron main process cannot make outbound HTTPS requests reliably
(ERR_NETWORK_IO_SUSPENDED / undici HTTP/2 issues), so we proxy through
the Python sidecar which has no such restrictions.

POST /llm/chat  →  { content, model, usage? }
"""

import json
import urllib.request
import urllib.error
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/llm")


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    base_url: str
    api_key: str
    model: str
    messages: list[ChatMessage]
    max_tokens: int = 4096
    temperature: float = 0.7


class ChatResponse(BaseModel):
    content: str
    model: str
    input_tokens: Optional[int] = None
    output_tokens: Optional[int] = None


@router.post("/chat", response_model=ChatResponse)
def llm_chat(req: ChatRequest):
    """Proxy an OpenAI-compatible chat/completions request to the given provider.
    Defined as sync def so FastAPI runs it in a thread pool (urllib is blocking).
    """
    url = req.base_url.rstrip("/") + "/chat/completions"

    body = json.dumps({
        "model": req.model,
        "stream": True,   # Qwen3 and similar models only support streaming
        "max_tokens": req.max_tokens,
        "temperature": req.temperature,
        "messages": [{"role": m.role, "content": m.content} for m in req.messages],
    }).encode("utf-8")

    http_req = urllib.request.Request(
        url,
        data=body,
        headers={
            "Authorization": f"Bearer {req.api_key}",
            "Content-Type": "application/json",
            "Accept": "text/event-stream",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(http_req, timeout=60) as resp:
            full_content = ""
            actual_model = req.model
            input_tokens = None
            output_tokens = None

            for raw_line in resp:
                line = raw_line.decode("utf-8").rstrip("\n\r")
                if not line or line == "data: [DONE]":
                    if line == "data: [DONE]":
                        break
                    continue
                if line.startswith("data: "):
                    try:
                        evt = json.loads(line[6:])
                        if "model" in evt:
                            actual_model = evt["model"]
                        choices = evt.get("choices", [])
                        if choices:
                            delta = choices[0].get("delta", {})
                            full_content += delta.get("content", "")
                            if choices[0].get("finish_reason") == "stop":
                                break
                        usage = evt.get("usage")
                        if usage:
                            input_tokens = usage.get("prompt_tokens")
                            output_tokens = usage.get("completion_tokens")
                    except json.JSONDecodeError:
                        pass  # skip malformed lines

            return ChatResponse(
                content=full_content,
                model=actual_model,
                input_tokens=input_tokens,
                output_tokens=output_tokens,
            )

    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8", errors="replace")
        try:
            err_json = json.loads(err_body)
            msg = err_json.get("error", {}).get("message", err_body[:200])
        except Exception:
            msg = err_body[:200]
        raise HTTPException(status_code=e.code, detail=msg)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
