// Home page - project management with video import
// Displays recent projects and import dropzone

import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, Film, Trash2, Clock, FolderOpen } from 'lucide-react'
import { App as AntdApp, Button, Card, Empty, Popconfirm, Spin, Tag } from 'antd'
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
  const { message } = AntdApp.useApp()
  const [projects, setProjects] = useState<Project[]>([])
  const [importing, setImporting] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

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
          message.success('视频导入成功')
          navigate(`/editor/${(created.project as { id: string }).id}`)
        }
      }
    } catch {
      message.error('导入失败，请重试')
    } finally {
      setImporting(false)
    }
  }

  const handleDelete = async (projectId: string) => {
    setDeletingId(projectId)
    try {
      await window.api.project.delete(projectId)
      message.success('项目已删除')
      loadProjects()
    } finally {
      setDeletingId(null)
    }
  }

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const file = e.dataTransfer.files[0]
      if (!file) return

      const filePath = (file as unknown as { path: string }).path
      if (!filePath) return

      setImporting(true)
      try {
        const created = await window.api.project.create(filePath)
        if (created.ok && created.project) {
          message.success('视频导入成功')
          navigate(`/editor/${(created.project as { id: string }).id}`)
        }
      } catch {
        message.error('导入失败，请重试')
      } finally {
        setImporting(false)
      }
    },
    [navigate, message],
  )

  return (
    <div className="mx-auto max-w-4xl">
      {/* Import dropzone */}
      <div
        className={cn(
          'group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-14 transition-all duration-200 cursor-pointer select-none',
          dragOver
            ? 'border-brand bg-brand/8 scale-[1.01]'
            : 'border-border hover:border-brand/50 hover:bg-surface-2/40',
          importing && 'pointer-events-none',
        )}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={importing ? undefined : handleImport}
        role="button"
        tabIndex={0}
      >
        <div
          className={cn(
            'flex h-16 w-16 items-center justify-center rounded-2xl mb-5 transition-all duration-200',
            dragOver
              ? 'bg-brand/25 text-brand scale-110'
              : 'bg-surface-3 text-text-muted group-hover:bg-brand/15 group-hover:text-brand',
          )}
        >
          {importing ? (
            <Spin size="large" />
          ) : (
            <Upload className="h-7 w-7" />
          )}
        </div>

        <h2 className="mb-2 text-base font-semibold text-text">
          {importing ? '导入中，请稍候...' : dragOver ? '松开以导入' : '导入视频'}
        </h2>
        <p className="text-sm text-text-secondary mb-1">
          拖拽视频到此处，或点击选择文件
        </p>
        <p className="text-xs text-text-muted mt-1">支持 MP4、MOV、AVI、MKV 格式</p>
      </div>

      {/* Recent projects */}
      <div className="mt-8">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-3.5 w-3.5 text-text-muted" />
          <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">
            最近项目
          </span>
          {projects.length > 0 && (
            <Tag bordered={false} color="default" className="ml-auto text-[10px]">
              {projects.length} 个
            </Tag>
          )}
        </div>

        {projects.length === 0 ? (
          <Empty
            image={<FolderOpen className="h-12 w-12 text-text-muted mx-auto" />}
            description={
              <span className="text-text-muted text-sm">暂无项目，导入视频开始剪辑</span>
            }
            imageStyle={{ height: 56 }}
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {projects.map((project) => (
              <Card
                key={project.id}
                hoverable
                onClick={() => navigate(`/editor/${project.id}`)}
                styles={{
                  body: { padding: '12px' },
                }}
                style={{
                  background: '#222222',
                  border: '1px solid #3A3A3A',
                  cursor: 'pointer',
                }}
                className="group transition-all duration-150"
                extra={
                  <Popconfirm
                    title="删除项目"
                    description="确定要删除这个项目吗？此操作不可撤销。"
                    onConfirm={(e) => {
                      e?.stopPropagation()
                      void handleDelete(project.id)
                    }}
                    onCancel={(e) => e?.stopPropagation()}
                    okText="删除"
                    cancelText="取消"
                    okButtonProps={{ danger: true, size: 'small' }}
                    cancelButtonProps={{ size: 'small' }}
                  >
                    <Button
                      type="text"
                      size="small"
                      danger
                      loading={deletingId === project.id}
                      icon={<Trash2 className="h-3.5 w-3.5" />}
                      className="opacity-0 group-hover:opacity-100 transition-opacity !p-0.5 !h-auto !w-auto"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Popconfirm>
                }
              >
                {/* Thumbnail */}
                <div className="mb-3 flex h-20 items-center justify-center rounded-lg bg-surface-3">
                  <Film className="h-7 w-7 text-text-muted" />
                </div>

                <p className="truncate text-xs font-medium text-text leading-5" title={project.name}>
                  {project.name}
                </p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-[11px] text-text-muted">{formatFileSize(project.fileSize)}</p>
                  <Tag
                    bordered={false}
                    color={project.status === 'done' ? 'cyan' : 'default'}
                    className="text-[10px] !px-1 !py-0 !leading-4"
                  >
                    {project.status === 'done' ? '已完成' : '草稿'}
                  </Tag>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
