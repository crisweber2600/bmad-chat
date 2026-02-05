import { useState } from 'react'
import { LineComment, User } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CheckCircle, ChatCircle, X, ArrowBendDownRight } from '@phosphor-icons/react'
import { formatDistanceToNow } from 'date-fns'
import { EmojiReactionPicker } from '@/components/EmojiReactionPicker'
import { EmojiReactionsDisplay } from '@/components/EmojiReactionsDisplay'

interface InlineCommentThreadProps {
  comments: LineComment[]
  lineNumber: number
  lineType: 'addition' | 'deletion' | 'unchanged'
  onAddComment: (content: string, parentId?: string) => void
  onResolve: (commentId: string) => void
  onClose: () => void
  currentUser: User
  onToggleReaction: (commentId: string, emoji: string) => void
}

export function InlineCommentThread({
  comments,
  lineNumber,
  lineType,
  onAddComment,
  onResolve,
  onClose,
  currentUser,
  onToggleReaction,
}: InlineCommentThreadProps) {
  const [newComment, setNewComment] = useState('')
  const [replyToId, setReplyToId] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')

  const rootComments = comments.filter(c => !c.replies)
  const isResolved = rootComments.length > 0 && rootComments[0].resolved

  const handleSubmit = () => {
    if (newComment.trim()) {
      onAddComment(newComment)
      setNewComment('')
    }
  }

  const handleReply = (parentId: string) => {
    if (replyContent.trim()) {
      onAddComment(replyContent, parentId)
      setReplyContent('')
      setReplyToId(null)
    }
  }

  const getLineTypeColor = () => {
    switch (lineType) {
      case 'addition':
        return 'border-green-400 bg-green-50/50'
      case 'deletion':
        return 'border-red-400 bg-red-50/50'
      default:
        return 'border-border bg-background'
    }
  }

  const renderComment = (comment: LineComment, isReply = false) => (
    <div key={comment.id} className={`flex gap-2 ${isReply ? '' : ''}`}>
      <Avatar className={`${isReply ? 'h-6 w-6' : 'h-7 w-7'} shrink-0`}>
        <AvatarImage src={comment.authorAvatar} />
        <AvatarFallback className={`${isReply ? 'text-xs' : 'text-xs'} ${isReply ? 'bg-secondary text-secondary-foreground' : 'bg-primary text-primary-foreground'}`}>
          {comment.author.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className={`font-medium ${isReply ? 'text-xs' : 'text-sm'}`}>{comment.author}</span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(comment.timestamp, { addSuffix: true })}
          </span>
        </div>
        <p className={`${isReply ? 'text-xs' : 'text-sm'} mt-1 break-words`}>{comment.content}</p>
        
        <EmojiReactionsDisplay
          reactions={comment.reactions || []}
          currentUserId={currentUser.id}
          onToggle={(emoji) => onToggleReaction(comment.id, emoji)}
        />
        
        {!isReply && (
          <div className="flex items-center gap-2 mt-2">
            <EmojiReactionPicker onSelect={(emoji) => onToggleReaction(comment.id, emoji)} />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReplyToId(comment.id)}
              className="h-7 px-2 text-xs"
            >
              <ArrowBendDownRight size={12} className="mr-1" />
              Reply
            </Button>
            {!comment.resolved && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onResolve(comment.id)}
                className="h-7 px-2 text-xs"
              >
                <CheckCircle size={12} className="mr-1" />
                Resolve
              </Button>
            )}
          </div>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3 pl-4 border-l-2 border-muted space-y-2">
            {comment.replies.map((reply) => renderComment(reply, true))}
          </div>
        )}

        {replyToId === comment.id && (
          <div className="mt-3 pl-4 border-l-2 border-primary">
            <div className="flex gap-2">
              <Avatar className="h-6 w-6 shrink-0">
                <AvatarImage src={currentUser.avatarUrl} />
                <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                  {currentUser.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <Textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write a reply..."
                  className="min-h-[60px] text-xs resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      handleReply(comment.id)
                    }
                  }}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleReply(comment.id)}
                    disabled={!replyContent.trim()}
                    className="h-7 px-3 text-xs"
                  >
                    Reply
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setReplyToId(null)
                      setReplyContent('')
                    }}
                    className="h-7 px-3 text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <Card className={`border-2 shadow-lg ${getLineTypeColor()}`}>
      <div className="p-3 border-b flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <ChatCircle size={18} weight="duotone" className="text-primary shrink-0" />
          <span className="text-sm font-medium">
            Line {lineNumber}
            {lineType === 'addition' && (
              <Badge variant="outline" className="ml-2 text-xs bg-green-100 text-green-700 border-green-300">
                Addition
              </Badge>
            )}
            {lineType === 'deletion' && (
              <Badge variant="outline" className="ml-2 text-xs bg-red-100 text-red-700 border-red-300">
                Deletion
              </Badge>
            )}
          </span>
          {isResolved && (
            <Badge variant="outline" className="ml-auto text-xs bg-primary/10 text-primary border-primary/20">
              <CheckCircle size={12} weight="bold" className="mr-1" />
              Resolved
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-7 w-7 shrink-0"
        >
          <X size={16} />
        </Button>
      </div>

      <ScrollArea className="max-h-[400px]">
        <div className="p-3 space-y-3">
          {rootComments.map((comment) => (
            <div key={comment.id} className="space-y-2">
              {renderComment(comment)}
            </div>
          ))}

          {!isResolved && (
            <div className="flex gap-2 pt-2 border-t">
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarImage src={currentUser.avatarUrl} />
                <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                  {currentUser.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="min-h-[80px] text-sm resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      handleSubmit()
                    }
                  }}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleSubmit}
                    disabled={!newComment.trim()}
                  >
                    Comment
                  </Button>
                  <span className="text-xs text-muted-foreground self-center">
                    {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}+Enter to submit
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  )
}
