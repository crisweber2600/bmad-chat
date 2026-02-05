import { useState } from 'react'
import { PullRequest, PRComment, User } from '@/lib/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { GitMerge, CheckCircle, XCircle, User as UserIcon, Eye, FileText } from '@phosphor-icons/react'
import { FileDiffViewer } from './FileDiffViewer'
import { AllFilesPreviewDialog } from './AllFilesPreviewDialog'
import { cn } from '@/lib/utils'

interface PRDialogProps {
  pr: PullRequest | null
  open: boolean
  onClose: () => void
  onMerge: (prId: string) => void
  onClosePR: (prId: string) => void
  onComment: (prId: string, comment: string) => void
  onApprove: (prId: string) => void
  currentUser: User | null
  onAddLineComment?: (prId: string, fileId: string, lineNumber: number, lineType: 'addition' | 'deletion' | 'unchanged', content: string, parentId?: string) => void
  onResolveLineComment?: (prId: string, commentId: string) => void
  onToggleReaction?: (prId: string, commentId: string, emoji: string) => void
}

export function PRDialog({
  pr,
  open,
  onClose,
  onMerge,
  onClosePR,
  onComment,
  onApprove,
  currentUser,
  onAddLineComment,
  onResolveLineComment,
  onToggleReaction,
}: PRDialogProps) {
  const [comment, setComment] = useState('')
  const [showAllChanges, setShowAllChanges] = useState(true)
  const [allFilesPreviewOpen, setAllFilesPreviewOpen] = useState(false)

  if (!pr) return null

  const handleComment = () => {
    if (comment.trim()) {
      onComment(pr.id, comment.trim())
      setComment('')
    }
  }

  const handleAddLineComment = (fileId: string, lineNumber: number, lineType: 'addition' | 'deletion' | 'unchanged', content: string, parentId?: string) => {
    if (onAddLineComment) {
      onAddLineComment(pr.id, fileId, lineNumber, lineType, content, parentId)
    }
  }

  const handleResolveLineComment = (commentId: string) => {
    if (onResolveLineComment) {
      onResolveLineComment(pr.id, commentId)
    }
  }

  const handleToggleReaction = (commentId: string, emoji: string) => {
    if (onToggleReaction) {
      onToggleReaction(pr.id, commentId, emoji)
    }
  }

  const hasApproved = !!(currentUser && pr.approvals.includes(currentUser.id))
  const canMerge = pr.status === 'open' && pr.approvals.length > 0

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] w-[95vw] sm:w-full flex flex-col p-4 sm:p-6">
        <DialogHeader>
          <div className="flex items-start sm:items-center gap-2 sm:gap-3 flex-col sm:flex-row">
            <DialogTitle className="text-xl sm:text-2xl flex-1">{pr.title}</DialogTitle>
            <Badge
              variant="outline"
              className={cn(
                'text-xs',
                pr.status === 'merged' && 'bg-green-50 text-green-700 border-green-200',
                pr.status === 'open' && 'bg-blue-50 text-blue-700 border-blue-200',
                pr.status === 'closed' && 'bg-red-50 text-red-700 border-red-200'
              )}
            >
              {pr.status}
            </Badge>
          </div>
          <DialogDescription className="text-sm">{pr.description}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-2 sm:pr-4">
          <div className="space-y-4 sm:space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <h3 className="font-semibold text-sm sm:text-base">File Changes ({pr.fileChanges.length})</h3>
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setAllFilesPreviewOpen(true)}
                    className="h-8 text-xs"
                  >
                    <FileText size={14} className="mr-1.5" />
                    Preview All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAllChanges(!showAllChanges)}
                    className="h-8 text-xs"
                  >
                    <Eye size={14} className="mr-1.5" />
                    {showAllChanges ? 'Hide' : 'Show'}
                  </Button>
                </div>
              </div>
              {showAllChanges && (
                <FileDiffViewer 
                  fileChanges={pr.fileChanges}
                  onAddLineComment={handleAddLineComment}
                  onResolveComment={handleResolveLineComment}
                  onToggleReaction={handleToggleReaction}
                  currentUser={currentUser}
                />
              )}
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-2 sm:mb-3 text-sm sm:text-base">
                Comments ({pr.comments.length})
              </h3>
              <div className="space-y-2 sm:space-y-3">
                {pr.comments.map((comment) => (
                  <div key={comment.id} className="flex gap-2 sm:gap-3">
                    <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
                      <AvatarFallback className="bg-muted">
                        <UserIcon size={14} className="sm:w-4 sm:h-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs sm:text-sm font-medium truncate">{comment.author}</span>
                        <span className="text-[10px] sm:text-xs text-muted-foreground shrink-0">
                          {new Date(comment.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-foreground break-words">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              {pr.status === 'open' && (
                <div className="mt-3 sm:mt-4 space-y-2">
                  <Textarea
                    id="pr-comment-input"
                    placeholder="Add a comment..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="min-h-[60px] sm:min-h-[80px] text-sm"
                  />
                  <Button onClick={handleComment} size="sm" className="w-full sm:w-auto">
                    Comment
                  </Button>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        {pr.status === 'open' && (
          <div className="flex flex-col sm:flex-row gap-2 pt-3 sm:pt-4 border-t">
            <Button
              onClick={() => onApprove(pr.id)}
              variant={hasApproved ? 'secondary' : 'default'}
              disabled={hasApproved}
              className="flex-1 text-sm"
              size="sm"
            >
              <CheckCircle size={16} weight="fill" className="mr-1 sm:mr-2" />
              {hasApproved ? 'Approved' : 'Approve'}
            </Button>
            <Button
              onClick={() => onMerge(pr.id)}
              disabled={!canMerge}
              variant="default"
              className="flex-1 bg-green-600 hover:bg-green-700 text-sm"
              size="sm"
            >
              <GitMerge size={16} weight="fill" className="mr-1 sm:mr-2" />
              Merge PR
            </Button>
            <Button onClick={() => onClosePR(pr.id)} variant="destructive" size="sm" className="text-sm">
              <XCircle size={16} weight="fill" className="mr-1 sm:mr-2" />
              Close
            </Button>
          </div>
        )}
      </DialogContent>

      <AllFilesPreviewDialog
        fileChanges={pr.fileChanges}
        open={allFilesPreviewOpen}
        onClose={() => setAllFilesPreviewOpen(false)}
        onAddLineComment={handleAddLineComment}
        onResolveComment={handleResolveLineComment}
        onToggleReaction={handleToggleReaction}
        currentUser={currentUser}
      />
    </Dialog>
  )
}
