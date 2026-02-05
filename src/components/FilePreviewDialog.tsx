import { useState } from 'react'
import { FileChange, LineComment, User } from '@/lib/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { FileText, SplitVertical, Eye, ChatCircle, Plus } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { InlineCommentThread } from './InlineCommentThread'

interface FilePreviewDialogProps {
  fileChange: FileChange | null
  open: boolean
  onClose: () => void
  onAddLineComment?: (lineNumber: number, lineType: 'addition' | 'deletion' | 'unchanged', content: string, parentId?: string) => void
  onResolveComment?: (commentId: string) => void
  onToggleReaction?: (commentId: string, emoji: string) => void
  currentUser?: User | null
}

export function FilePreviewDialog({ fileChange, open, onClose, onAddLineComment, onResolveComment, onToggleReaction, currentUser }: FilePreviewDialogProps) {
  const [viewMode, setViewMode] = useState<'unified' | 'split' | 'before' | 'after'>('unified')
  const [activeCommentLine, setActiveCommentLine] = useState<{ line: number; type: 'addition' | 'deletion' | 'unchanged' } | null>(null)
  const [hoveredLine, setHoveredLine] = useState<number | null>(null)

  if (!fileChange) return null

  const beforeContent = fileChange.deletions
  const afterContent = fileChange.additions
  const hasChanges = beforeContent.length > 0 || afterContent.length > 0
  const lineComments = fileChange.lineComments || []

  const getCommentsForLine = (lineNumber: number, lineType: 'addition' | 'deletion' | 'unchanged') => {
    return lineComments.filter(c => c.lineNumber === lineNumber && c.lineType === lineType)
  }

  const handleAddComment = (lineNumber: number, lineType: 'addition' | 'deletion' | 'unchanged') => {
    setActiveCommentLine({ line: lineNumber, type: lineType })
  }

  const handleSubmitComment = (content: string, parentId?: string) => {
    if (activeCommentLine && onAddLineComment) {
      onAddLineComment(activeCommentLine.line, activeCommentLine.type, content, parentId)
    }
  }

  const handleResolveComment = (commentId: string) => {
    if (onResolveComment) {
      onResolveComment(commentId)
    }
  }

  const handleToggleReaction = (commentId: string, emoji: string) => {
    if (onToggleReaction) {
      onToggleReaction(commentId, emoji)
    }
  }

  const renderUnifiedView = () => {
    const allLines: Array<{ content: string; type: 'deletion' | 'addition' | 'unchanged'; lineNumber: number }> = []
    
    let lineCounter = 0
    beforeContent.forEach(line => {
      lineCounter++
      allLines.push({ content: line, type: 'deletion', lineNumber: lineCounter })
    })
    
    afterContent.forEach(line => {
      lineCounter++
      allLines.push({ content: line, type: 'addition', lineNumber: lineCounter })
    })

    return (
      <div className="font-mono text-xs leading-relaxed">
        {allLines.map((line, idx) => {
          const comments = getCommentsForLine(line.lineNumber, line.type)
          const hasComments = comments.length > 0
          const isCommentOpen = activeCommentLine?.line === line.lineNumber && activeCommentLine?.type === line.type
          const isHovered = hoveredLine === idx

          return (
            <div key={idx}>
              <div
                className={cn(
                  'px-3 py-1.5 border-l-2 group relative flex items-center gap-2',
                  line.type === 'deletion' && 'bg-red-50/50 border-red-400 text-red-900',
                  line.type === 'addition' && 'bg-green-50/50 border-green-400 text-green-900',
                  line.type === 'unchanged' && 'bg-background border-border',
                  (hasComments || isCommentOpen) && 'border-l-4'
                )}
                onMouseEnter={() => setHoveredLine(idx)}
                onMouseLeave={() => setHoveredLine(null)}
              >
                <span className={cn(
                  'inline-block w-8 select-none',
                  line.type === 'deletion' ? 'text-red-500' : line.type === 'addition' ? 'text-green-500' : 'text-muted-foreground'
                )}>
                  {line.type === 'deletion' ? '-' : line.type === 'addition' ? '+' : ' '}
                </span>
                <span className="inline-block w-10 select-none text-muted-foreground text-right">
                  {line.lineNumber}
                </span>
                <span className="break-all flex-1">{line.content}</span>
                
                {onAddLineComment && currentUser && (isHovered || hasComments) && (
                  <div className="flex items-center gap-1 ml-2 shrink-0">
                    {hasComments && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAddComment(line.lineNumber, line.type)}
                        className="h-6 px-2 text-xs"
                      >
                        <ChatCircle size={14} weight="fill" className="text-primary" />
                        <span className="ml-1">{comments.length}</span>
                      </Button>
                    )}
                    {!hasComments && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAddComment(line.lineNumber, line.type)}
                        className="h-6 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Plus size={14} weight="bold" />
                        <ChatCircle size={14} className="ml-1" />
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {isCommentOpen && currentUser && (
                <div className="px-3 py-3 bg-muted/30 border-b">
                  <InlineCommentThread
                    comments={comments}
                    lineNumber={line.lineNumber}
                    lineType={line.type}
                    onAddComment={handleSubmitComment}
                    onResolve={handleResolveComment}
                    onClose={() => setActiveCommentLine(null)}
                    currentUser={currentUser}
                    onToggleReaction={handleToggleReaction}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  const renderSplitView = () => {
    const maxLines = Math.max(beforeContent.length, afterContent.length)

    return (
      <div className="grid grid-cols-2 gap-px bg-border">
        <div className="bg-background">
          <div className="sticky top-0 bg-red-50 border-b border-red-200 px-3 py-2 font-semibold text-xs text-red-900 flex items-center gap-2 z-10">
            <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">Before</Badge>
            <span className="text-muted-foreground ml-auto">{beforeContent.length} lines</span>
          </div>
          <div className="font-mono text-xs">
            {beforeContent.map((line, idx) => {
              const lineNumber = idx + 1
              const comments = getCommentsForLine(lineNumber, 'deletion')
              const hasComments = comments.length > 0
              const isCommentOpen = activeCommentLine?.line === lineNumber && activeCommentLine?.type === 'deletion'
              const isHovered = hoveredLine === idx

              return (
                <div key={idx}>
                  <div
                    className={cn(
                      'px-3 py-1.5 bg-red-50/30 border-l-2 border-red-300 group relative flex items-center gap-2',
                      (hasComments || isCommentOpen) && 'border-l-4'
                    )}
                    onMouseEnter={() => setHoveredLine(idx)}
                    onMouseLeave={() => setHoveredLine(null)}
                  >
                    <span className="inline-block w-8 select-none text-red-400">{lineNumber}</span>
                    <span className="text-red-900 break-all flex-1">{line}</span>
                    
                    {onAddLineComment && currentUser && (isHovered || hasComments) && (
                      <div className="flex items-center gap-1 ml-2 shrink-0">
                        {hasComments && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAddComment(lineNumber, 'deletion')}
                            className="h-6 px-2 text-xs"
                          >
                            <ChatCircle size={14} weight="fill" className="text-primary" />
                            <span className="ml-1">{comments.length}</span>
                          </Button>
                        )}
                        {!hasComments && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAddComment(lineNumber, 'deletion')}
                            className="h-6 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Plus size={14} weight="bold" />
                            <ChatCircle size={14} className="ml-1" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {isCommentOpen && currentUser && (
                    <div className="px-3 py-3 bg-muted/30 border-b">
                      <InlineCommentThread
                        comments={comments}
                        lineNumber={lineNumber}
                        lineType="deletion"
                        onAddComment={handleSubmitComment}
                        onResolve={handleResolveComment}
                        onClose={() => setActiveCommentLine(null)}
                        currentUser={currentUser}
                        onToggleReaction={handleToggleReaction}
                      />
                    </div>
                  )}
                </div>
              )
            })}
            {beforeContent.length === 0 && (
              <div className="px-3 py-8 text-center text-muted-foreground text-xs">
                No content before changes
              </div>
            )}
          </div>
        </div>

        <div className="bg-background">
          <div className="sticky top-0 bg-green-50 border-b border-green-200 px-3 py-2 font-semibold text-xs text-green-900 flex items-center gap-2 z-10">
            <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">After</Badge>
            <span className="text-muted-foreground ml-auto">{afterContent.length} lines</span>
          </div>
          <div className="font-mono text-xs">
            {afterContent.map((line, idx) => {
              const lineNumber = idx + 1
              const comments = getCommentsForLine(lineNumber, 'addition')
              const hasComments = comments.length > 0
              const isCommentOpen = activeCommentLine?.line === lineNumber && activeCommentLine?.type === 'addition'
              const isHovered = hoveredLine === (beforeContent.length + idx)

              return (
                <div key={idx}>
                  <div
                    className={cn(
                      'px-3 py-1.5 bg-green-50/30 border-l-2 border-green-300 group relative flex items-center gap-2',
                      (hasComments || isCommentOpen) && 'border-l-4'
                    )}
                    onMouseEnter={() => setHoveredLine(beforeContent.length + idx)}
                    onMouseLeave={() => setHoveredLine(null)}
                  >
                    <span className="inline-block w-8 select-none text-green-400">{lineNumber}</span>
                    <span className="text-green-900 break-all flex-1">{line}</span>
                    
                    {onAddLineComment && currentUser && (isHovered || hasComments) && (
                      <div className="flex items-center gap-1 ml-2 shrink-0">
                        {hasComments && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAddComment(lineNumber, 'addition')}
                            className="h-6 px-2 text-xs"
                          >
                            <ChatCircle size={14} weight="fill" className="text-primary" />
                            <span className="ml-1">{comments.length}</span>
                          </Button>
                        )}
                        {!hasComments && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAddComment(lineNumber, 'addition')}
                            className="h-6 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Plus size={14} weight="bold" />
                            <ChatCircle size={14} className="ml-1" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  {isCommentOpen && currentUser && (
                    <div className="px-3 py-3 bg-muted/30 border-b">
                      <InlineCommentThread
                        comments={comments}
                        lineNumber={lineNumber}
                        lineType="addition"
                        onAddComment={handleSubmitComment}
                        onResolve={handleResolveComment}
                        onClose={() => setActiveCommentLine(null)}
                        currentUser={currentUser}
                        onToggleReaction={handleToggleReaction}
                      />
                    </div>
                  )}
                </div>
              )
            })}
            {afterContent.length === 0 && (
              <div className="px-3 py-8 text-center text-muted-foreground text-xs">
                No content after changes
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const renderBeforeView = () => {
    return (
      <div className="font-mono text-xs">
        <div className="sticky top-0 bg-muted border-b px-3 py-2 font-semibold text-xs flex items-center gap-2">
          <Badge variant="outline">Before Changes</Badge>
          <span className="text-muted-foreground ml-auto">{beforeContent.length} lines</span>
        </div>
        {beforeContent.map((line, idx) => (
          <div key={idx} className="px-3 py-1 hover:bg-muted/50">
            <span className="inline-block w-8 select-none mr-3 text-muted-foreground">{idx + 1}</span>
            <span className="break-all">{line}</span>
          </div>
        ))}
        {beforeContent.length === 0 && (
          <div className="px-3 py-8 text-center text-muted-foreground text-xs">
            This is a new file - no previous content
          </div>
        )}
      </div>
    )
  }

  const renderAfterView = () => {
    return (
      <div className="font-mono text-xs">
        <div className="sticky top-0 bg-muted border-b px-3 py-2 font-semibold text-xs flex items-center gap-2">
          <Badge variant="outline">After Changes</Badge>
          <span className="text-muted-foreground ml-auto">{afterContent.length} lines</span>
        </div>
        {afterContent.map((line, idx) => (
          <div key={idx} className="px-3 py-1 hover:bg-muted/50">
            <span className="inline-block w-8 select-none mr-3 text-muted-foreground">{idx + 1}</span>
            <span className="break-all">{line}</span>
          </div>
        ))}
        {afterContent.length === 0 && (
          <div className="px-3 py-8 text-center text-muted-foreground text-xs">
            This file will be deleted - no content after changes
          </div>
        )}
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] w-[95vw] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center gap-3">
            <FileText size={24} weight="duotone" className="text-primary" />
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl font-mono truncate">{fileChange.path}</DialogTitle>
              <DialogDescription className="flex items-center gap-2 mt-1 flex-wrap">
                {beforeContent.length > 0 && (
                  <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                    -{beforeContent.length} lines removed
                  </Badge>
                )}
                {afterContent.length > 0 && (
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                    +{afterContent.length} lines added
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs capitalize">
                  {fileChange.status}
                </Badge>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 py-3 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">View Mode:</span>
            <div className="flex gap-1">
              <Button
                variant={viewMode === 'unified' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('unified')}
                className="h-8 px-3 text-xs"
              >
                <Eye size={14} className="mr-1.5" />
                Unified
              </Button>
              <Button
                variant={viewMode === 'split' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('split')}
                className="h-8 px-3 text-xs"
              >
                <SplitVertical size={14} className="mr-1.5" />
                Split
              </Button>
              <Button
                variant={viewMode === 'before' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('before')}
                className="h-8 px-3 text-xs"
              >
                Before
              </Button>
              <Button
                variant={viewMode === 'after' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('after')}
                className="h-8 px-3 text-xs"
              >
                After
              </Button>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 max-h-[60vh]">
          <div className="p-4">
            {!hasChanges ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText size={48} className="mx-auto mb-3 opacity-50" />
                <p>No changes detected in this file</p>
              </div>
            ) : (
              <>
                {viewMode === 'unified' && renderUnifiedView()}
                {viewMode === 'split' && renderSplitView()}
                {viewMode === 'before' && renderBeforeView()}
                {viewMode === 'after' && renderAfterView()}
              </>
            )}
          </div>
        </ScrollArea>

        <div className="px-6 py-4 border-t bg-muted/30 flex justify-end">
          <Button onClick={onClose} variant="outline">
            Close Preview
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
