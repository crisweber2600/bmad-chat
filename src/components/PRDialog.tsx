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
import { GitMerge, CheckCircle, XCircle, User as UserIcon } from '@phosphor-icons/react'
import { FileDiffViewer } from './FileDiffViewer'
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
}: PRDialogProps) {
  const [comment, setComment] = useState('')

  if (!pr) return null

  const handleComment = () => {
    if (comment.trim()) {
      onComment(pr.id, comment.trim())
      setComment('')
    }
  }

  const hasApproved = !!(currentUser && pr.approvals.includes(currentUser.id))
  const canMerge = pr.status === 'open' && pr.approvals.length > 0

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <DialogTitle className="text-2xl flex-1">{pr.title}</DialogTitle>
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
          <DialogDescription>{pr.description}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3">File Changes</h3>
              <FileDiffViewer fileChanges={pr.fileChanges} />
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-3">
                Comments ({pr.comments.length})
              </h3>
              <div className="space-y-3">
                {pr.comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-muted">
                        <UserIcon size={16} />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">{comment.author}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(comment.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-foreground">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              {pr.status === 'open' && (
                <div className="mt-4 space-y-2">
                  <Textarea
                    id="pr-comment-input"
                    placeholder="Add a comment..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="min-h-[80px]"
                  />
                  <Button onClick={handleComment} size="sm">
                    Comment
                  </Button>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        {pr.status === 'open' && (
          <div className="flex gap-2 pt-4 border-t">
            <Button
              onClick={() => onApprove(pr.id)}
              variant={hasApproved ? 'secondary' : 'default'}
              disabled={hasApproved}
              className="flex-1"
            >
              <CheckCircle size={18} weight="fill" className="mr-2" />
              {hasApproved ? 'Approved' : 'Approve'}
            </Button>
            <Button
              onClick={() => onMerge(pr.id)}
              disabled={!canMerge}
              variant="default"
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <GitMerge size={18} weight="fill" className="mr-2" />
              Merge PR
            </Button>
            <Button onClick={() => onClosePR(pr.id)} variant="destructive">
              <XCircle size={18} weight="fill" className="mr-2" />
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
