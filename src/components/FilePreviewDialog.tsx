import { useState } from 'react'
import { FileChange } from '@/lib/types'
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
import { FileText, SplitVertical, Eye } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface FilePreviewDialogProps {
  fileChange: FileChange | null
  open: boolean
  onClose: () => void
}

export function FilePreviewDialog({ fileChange, open, onClose }: FilePreviewDialogProps) {
  const [viewMode, setViewMode] = useState<'unified' | 'split' | 'before' | 'after'>('unified')

  if (!fileChange) return null

  const beforeContent = fileChange.deletions
  const afterContent = fileChange.additions
  const hasChanges = beforeContent.length > 0 || afterContent.length > 0

  const renderUnifiedView = () => {
    const allLines: Array<{ content: string; type: 'deletion' | 'addition' | 'unchanged' }> = []
    
    beforeContent.forEach(line => {
      allLines.push({ content: line, type: 'deletion' })
    })
    
    afterContent.forEach(line => {
      allLines.push({ content: line, type: 'addition' })
    })

    return (
      <div className="font-mono text-xs leading-relaxed">
        {allLines.map((line, idx) => (
          <div
            key={idx}
            className={cn(
              'px-3 py-1 border-l-2',
              line.type === 'deletion' && 'bg-red-50/50 border-red-400 text-red-900',
              line.type === 'addition' && 'bg-green-50/50 border-green-400 text-green-900',
              line.type === 'unchanged' && 'bg-background border-border'
            )}
          >
            <span className={cn(
              'inline-block w-8 select-none mr-3',
              line.type === 'deletion' ? 'text-red-500' : line.type === 'addition' ? 'text-green-500' : 'text-muted-foreground'
            )}>
              {line.type === 'deletion' ? '-' : line.type === 'addition' ? '+' : ' '}
            </span>
            <span className="break-all">{line.content}</span>
          </div>
        ))}
      </div>
    )
  }

  const renderSplitView = () => {
    const maxLines = Math.max(beforeContent.length, afterContent.length)

    return (
      <div className="grid grid-cols-2 gap-px bg-border">
        <div className="bg-background">
          <div className="sticky top-0 bg-red-50 border-b border-red-200 px-3 py-2 font-semibold text-xs text-red-900 flex items-center gap-2">
            <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">Before</Badge>
            <span className="text-muted-foreground ml-auto">{beforeContent.length} lines</span>
          </div>
          <div className="font-mono text-xs">
            {beforeContent.map((line, idx) => (
              <div key={idx} className="px-3 py-1 bg-red-50/30 border-l-2 border-red-300">
                <span className="inline-block w-8 select-none mr-3 text-red-400">{idx + 1}</span>
                <span className="text-red-900 break-all">{line}</span>
              </div>
            ))}
            {beforeContent.length === 0 && (
              <div className="px-3 py-8 text-center text-muted-foreground text-xs">
                No content before changes
              </div>
            )}
          </div>
        </div>

        <div className="bg-background">
          <div className="sticky top-0 bg-green-50 border-b border-green-200 px-3 py-2 font-semibold text-xs text-green-900 flex items-center gap-2">
            <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">After</Badge>
            <span className="text-muted-foreground ml-auto">{afterContent.length} lines</span>
          </div>
          <div className="font-mono text-xs">
            {afterContent.map((line, idx) => (
              <div key={idx} className="px-3 py-1 bg-green-50/30 border-l-2 border-green-300">
                <span className="inline-block w-8 select-none mr-3 text-green-400">{idx + 1}</span>
                <span className="text-green-900 break-all">{line}</span>
              </div>
            ))}
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
