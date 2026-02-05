import { useState } from 'react'
import { FileChange, User } from '@/lib/types'
import { FilePreviewDialog } from './FilePreviewDialog'

interface AllFilesPreviewDialogProps {
  fileChanges: FileChange[]
  open: boolean
  onClose: () => void
  onAddLineComment?: (fileId: string, lineNumber: number, lineType: 'addition' | 'deletion' | 'unchanged', content: string, parentId?: string) => void
  onResolveComment?: (commentId: string) => void
  onToggleReaction?: (commentId: string, emoji: string) => void
  currentUser?: User | null
}

export function AllFilesPreviewDialog({ fileChanges, open, onClose, onAddLineComment, onResolveComment, onToggleReaction, currentUser }: AllFilesPreviewDialogProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [previewOpen, setPreviewOpen] = useState(false)

  if (fileChanges.length === 0) return null

  const currentFile = fileChanges[currentIndex]

  const handleOpenPreview = () => {
    setPreviewOpen(true)
  }

  const handleClosePreview = () => {
    setPreviewOpen(false)
    if (currentIndex >= fileChanges.length - 1) {
      onClose()
    } else {
      setCurrentIndex(prev => prev + 1)
    }
  }

  const handleAddLineComment = (lineNumber: number, lineType: 'addition' | 'deletion' | 'unchanged', content: string, parentId?: string) => {
    if (onAddLineComment && currentFile) {
      onAddLineComment(currentFile.path, lineNumber, lineType, content, parentId)
    }
  }

  if (open && !previewOpen) {
    setPreviewOpen(true)
  }

  return (
    <FilePreviewDialog
      fileChange={currentFile}
      open={previewOpen}
      onClose={handleClosePreview}
      onAddLineComment={handleAddLineComment}
      onResolveComment={onResolveComment}
      onToggleReaction={onToggleReaction}
      currentUser={currentUser}
    />
  )
}
