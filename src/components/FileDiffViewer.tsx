import { useState } from 'react'
import { FileChange, User } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileText, Eye } from '@phosphor-icons/react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { FilePreviewDialog } from './FilePreviewDialog'

interface FileDiffViewerProps {
  fileChanges: FileChange[]
  onAddLineComment?: (fileId: string, lineNumber: number, lineType: 'addition' | 'deletion' | 'unchanged', content: string, parentId?: string) => void
  onResolveComment?: (commentId: string) => void
  currentUser?: User | null
}

export function FileDiffViewer({ fileChanges, onAddLineComment, onResolveComment, currentUser }: FileDiffViewerProps) {
  const [previewFile, setPreviewFile] = useState<FileChange | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  const handlePreview = (change: FileChange) => {
    setPreviewFile(change)
    setPreviewOpen(true)
  }

  const handleAddLineComment = (lineNumber: number, lineType: 'addition' | 'deletion' | 'unchanged', content: string, parentId?: string) => {
    if (previewFile && onAddLineComment) {
      onAddLineComment(previewFile.path, lineNumber, lineType, content, parentId)
    }
  }
  if (fileChanges.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No file changes yet
      </div>
    )
  }

  return (
    <>
      <div className="space-y-2 sm:space-y-3">
        <Accordion type="multiple" className="space-y-2">
          {fileChanges.map((change, idx) => (
            <AccordionItem key={idx} value={`file-${idx}`} className="border rounded-lg">
              <AccordionTrigger className="px-3 sm:px-4 hover:no-underline text-sm">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <FileText size={16} weight="duotone" className="text-primary shrink-0 sm:w-[18px] sm:h-[18px]" />
                  <span className="font-mono text-xs sm:text-sm text-left truncate">{change.path}</span>
                  <div className="flex gap-1 ml-auto mr-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handlePreview(change)
                      }}
                      className="h-7 px-2 text-xs"
                    >
                      <Eye size={14} className="sm:mr-1" />
                      <span className="hidden sm:inline">Preview</span>
                    </Button>
                    {change.additions.length > 0 && (
                      <Badge variant="outline" className="text-[10px] sm:text-xs bg-green-50 text-green-700 border-green-200 px-1.5 py-0">
                        +{change.additions.length}
                      </Badge>
                    )}
                    {change.deletions.length > 0 && (
                      <Badge variant="outline" className="text-[10px] sm:text-xs bg-red-50 text-red-700 border-red-200 px-1.5 py-0">
                        -{change.deletions.length}
                      </Badge>
                    )}
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-3 sm:px-4 pb-3 sm:pb-4">
                <div className="bg-muted rounded-md p-2 sm:p-3 font-mono text-xs sm:text-sm overflow-x-auto">
                  {change.deletions.length > 0 && (
                    <div className="space-y-0.5">
                      {change.deletions.map((line, i) => (
                        <div key={`del-${i}`} className="bg-red-50 text-red-800 px-1.5 sm:px-2 py-0.5 rounded break-all sm:break-normal">
                          <span className="text-red-400 mr-1 sm:mr-2">-</span>
                          <span className="break-words">{line}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {change.additions.length > 0 && (
                    <div className="space-y-0.5 mt-1">
                      {change.additions.map((line, i) => (
                        <div key={`add-${i}`} className="bg-green-50 text-green-800 px-1.5 sm:px-2 py-0.5 rounded break-all sm:break-normal">
                          <span className="text-green-400 mr-1 sm:mr-2">+</span>
                          <span className="break-words">{line}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      <FilePreviewDialog
        fileChange={previewFile}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        onAddLineComment={handleAddLineComment}
        onResolveComment={onResolveComment}
        currentUser={currentUser}
      />
    </>
  )
}
