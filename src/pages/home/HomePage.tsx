// Home page - project management with video import
// Displays recent projects and import dropzone

import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, Film, Trash2, Clock } from 'lucide-react'
import { cn, formatFileSize } from '@/lib/utils'

type Project = {
  id: string
  name: string
  createdAt: string
  sourceVideo: string
  fileSize: number
  status: string
}

export default function HomePage() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>([])
  const [importing, setImporting] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const loadProjects = useCallback(async () => {
    const list = await window.api.project.list()
    setProjects(list as Project[])
  }, [])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  const handleImport = async () => {
    setImporting(true)
    try {
      const result = await window.api.project.importDialog()
      if (result.ok && result.filePath) {
        const created = await window.api.project.create(result.filePath)
        if (created.ok && created.project) {
          navigate(`/editor/${(created.project as { id: string }).id}`)
        }
      }
    } finally {
      setImporting(false)
    }
  }

  const handleDelete = async (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation()
    await window.api.project.delete(projectId)
    loadProjects()
  }

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const file = e.dataTransfer.files[0]
      if (!file) return

      const filePath = (file as any).path
      if (!filePath) return

      setImporting(true)
      try {
        const created = await window.api.project.create(filePath)
        if (created.ok && created.project) {
          navigate(`/editor/${(created.project as { id: string }).id}`)
        }
      } finally {
        setImporting(false)
      }
    },
    [navigate],
  )

  return (
    <div className="mx-auto max-w-4xl">
      {/* Import dropzone */}
      <div
        className={cn(
          'flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 transition-colors',
          dragOver
            ? 'border-brand bg-brand/5'
            : 'border-border hover:border-text-muted',
        )}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={handleImport}
        role="button"
        tabIndex={0}
      >
        <Upload className="mb-4 h-10 w-10 text-text-muted" />
        <h2 className="mb-1 text-lg font-medium text-text">
          {importing ? '导入中...' : '导入新视频'}
        </h2>
        <p className="text-sm text-text-secondary">
          拖拽视频到此处，或点击选择文件
        </p>
        <p className="mt-2 text-xs text-text-muted">
          支持 MP4、MOV、AVI、MKV 格式
        </p>
      </div>

      {/* Recent projects */}
      {projects.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-medium text-text-secondary">
            <Clock className="h-4 w-4" />
            最近项目
          </h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {projects.map((project) => (
              <div
                key={project.id}
                className="group relative cursor-pointer rounded-lg border border-border bg-surface-2 p-4 transition-colors hover:border-text-muted"
                onClick={() => navigate(`/editor/${project.id}`)}
              >
                {/* Thumbnail placeholder */}
                <div className="mb-3 flex h-24 items-center justify-center rounded-md bg-surface-3">
                  <Film className="h-8 w-8 text-text-muted" />
                </div>

                <h4 className="truncate text-sm font-medium text-text">
                  {project.name}
                </h4>
                <p className="mt-1 text-xs text-text-muted">
                  {formatFileSize(project.fileSize)}
                </p>

                {/* Delete button */}
                <button
                  className="absolute right-2 top-2 hidden rounded p-1 text-text-muted hover:bg-danger/20 hover:text-danger group-hover:block"
                  onClick={(e) => handleDelete(e, project.id)}
                  title="删除项目"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
