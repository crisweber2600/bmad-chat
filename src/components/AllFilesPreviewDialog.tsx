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
import { Badge } from '@/components/ui/badge'
import { FileText, CaretLeft, CaretRight, SplitVertical, Eye } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'

interface AllFilesPreviewDialogProps {
  fileChanges: FileChange[]
  open: boolean
  onClose: () => void
}

export function AllFilesPreviewDialog({ fileChanges, open, onClose }: AllFilesPreviewDialogProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [viewMode, setViewMode] = useState<'unified' | 'split'>('unified')

  if (fileChanges.length === 0) return null

  const currentFile = fileChanges[currentIndex]
  const beforeContent = currentFile.deletions
  const afterContent = currentFile.additions

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : fileChanges.length - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < fileChanges.length - 1 ? prev + 1 : 0))
  }

  const renderUnifiedView = () => {
    const allLines: Array<{ content: string; type: 'deletion' | 'addition' }> = []
    
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
              'px-3 py-1.5 border-l-2',
              line.type === 'deletion' && 'bg-red-50/50 border-red-400 text-red-900',
              line.type === 'addition' && 'bg-green-50/50 border-green-400 text-green-900'
            )}
          >
            <span className={cn(
              'inline-block w-8 select-none mr-3',
              line.type === 'deletion' ? 'text-red-500' : 'text-green-500'
            )}>
              {line.type === 'deletion' ? '-' : '+'}
            </span>
            <span className="break-all">{line.content}</span>
          </div>
        ))}
        {allLines.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No changes in this file
          </div>
        )}
      </div>
    )
  }

  const renderSplitView = () => {
    return (
      <div className="grid grid-cols-2 gap-px bg-border min-h-[400px]">
        <div className="bg-background">
          <div className="sticky top-0 bg-red-50 border-b border-red-200 px-3 py-2 font-semibold text-xs text-red-900 flex items-center gap-2 z-10">
            <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">Before</Badge>
            <span className="text-muted-foreground ml-auto">{beforeContent.length} lines</span>
          </div>
          <div className="font-mono text-xs">
            {beforeContent.map((line, idx) => (
              <div key={idx} className="px-3 py-1.5 bg-red-50/30 border-l-2 border-red-300">
                <span className="inline-block w-8 select-none mr-3 text-red-400">{idx + 1}</span>
                <span className="text-red-900 break-all">{line}</span>
              </div>
            ))}
            {beforeContent.length === 0 && (
              <div className="px-3 py-12 text-center text-muted-foreground text-xs">
                No previous content
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
            {afterContent.map((line, idx) => (
              <div key={idx} className="px-3 py-1.5 bg-green-50/30 border-l-2 border-green-300">
                <span className="inline-block w-8 select-none mr-3 text-green-400">{idx + 1}</span>
                <span className="text-green-900 break-all">{line}</span>
              </div>
            ))}
            {afterContent.length === 0 && (
              <div className="px-3 py-12 text-center text-muted-foreground text-xs">
                No new content
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] w-[95vw] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <FileText size={24} weight="duotone" className="text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-lg font-mono truncate">{currentFile.path}</DialogTitle>
                <DialogDescription className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge variant="outline" className="text-xs">
                    File {currentIndex + 1} of {fileChanges.length}
                  </Badge>
                  {beforeContent.length > 0 && (
                    <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                      -{beforeContent.length}
                    </Badge>
                  )}
                  {afterContent.length > 0 && (
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                      +{afterContent.length}
                    </Badge>
                  )}
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPrevious}
                disabled={fileChanges.length === 1}
                className="h-9 w-9 p-0"
              >
                <CaretLeft size={16} weight="bold" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNext}
                disabled={fileChanges.length === 1}
                className="h-9 w-9 p-0"
              >
                <CaretRight size={16} weight="bold" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 py-3 border-b bg-muted/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">View:</span>
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
            </div>
          </div>

          {fileChanges.length > 1 && (
            <div className="text-xs text-muted-foreground hidden sm:block">
              Use arrow buttons to navigate files
            </div>
          )}
        </div>

        <ScrollArea className="flex-1 max-h-[55vh]">
          <div className="p-4">
            {viewMode === 'unified' ? renderUnifiedView() : renderSplitView()}
          </div>
        </ScrollArea>

        {fileChanges.length > 1 && (
          <>
            <Separator />
            <div className="px-6 py-3 bg-muted/20">
              <div className="text-xs font-medium mb-2 text-muted-foreground">All Files</div>
              <div className="flex flex-wrap gap-2">
                {fileChanges.map((file, idx) => (
                  <Button
                    key={idx}
                    variant={idx === currentIndex ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentIndex(idx)}
                    className="h-8 px-3 text-xs font-mono"
                  >
                    <FileText size={12} className="mr-1.5" />
                    {file.path.split('/').pop()}
                  </Button>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="px-6 py-4 border-t bg-muted/30 flex justify-between items-center">
          <div className="text-xs text-muted-foreground">
            Reviewing changes before merge
          </div>
          <Button onClick={onClose} variant="outline">
            Close Preview
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
