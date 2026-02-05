import { useState } from 'react'
import { FileChange, User } from '@/lib/types'
import { LineCommentService } from '@/lib/services'
import { toast } from 'sonner'

export function usePendingChanges() {
  const [pendingChanges, setPendingChanges] = useState<FileChange[]>([])

  const addChanges = (changes: FileChange[]) => {
    setPendingChanges((current) => [...current, ...changes])
  }

  const clearChanges = () => {
    setPendingChanges([])
  }

  const addLineComment = (
    fileId: string,
    lineNumber: number,
    lineType: 'addition' | 'deletion' | 'unchanged',
    content: string,
    currentUser: User,
    parentId?: string
  ) => {
    const comment = LineCommentService.createLineComment(
      fileId,
      lineNumber,
      lineType,
      content,
      currentUser
    )

    setPendingChanges((current) =>
      current.map((file) =>
        file.path === fileId
          ? LineCommentService.addCommentToFile(file, comment, parentId)
          : file
      )
    )

    toast.success('Comment added')
  }

  const resolveLineComment = (commentId: string) => {
    setPendingChanges((current) =>
      current.map((file) =>
        LineCommentService.resolveCommentInFile(file, commentId)
      )
    )
    toast.success('Comment resolved')
  }

  const toggleLineCommentReaction = (
    commentId: string,
    emoji: string,
    currentUser: User
  ) => {
    setPendingChanges((current) =>
      current.map((file) =>
        LineCommentService.toggleReactionInFile(file, commentId, emoji, currentUser)
      )
    )
  }

  return {
    pendingChanges,
    addChanges,
    clearChanges,
    addLineComment,
    resolveLineComment,
    toggleLineCommentReaction,
    hasChanges: pendingChanges.length > 0,
  }
}
