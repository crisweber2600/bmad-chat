import { FileChange } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText } from '@phosphor-icons/react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

interface FileDiffViewerProps {
  fileChanges: FileChange[]
}

export function FileDiffViewer({ fileChanges }: FileDiffViewerProps) {
  if (fileChanges.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No file changes yet
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <Accordion type="multiple" className="space-y-2">
        {fileChanges.map((change, idx) => (
          <AccordionItem key={idx} value={`file-${idx}`} className="border rounded-lg">
            <AccordionTrigger className="px-4 hover:no-underline">
              <div className="flex items-center gap-2 flex-1">
                <FileText size={18} weight="duotone" className="text-primary shrink-0" />
                <span className="font-mono text-sm text-left truncate">{change.path}</span>
                <div className="flex gap-1 ml-auto mr-2">
                  {change.additions.length > 0 && (
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                      +{change.additions.length}
                    </Badge>
                  )}
                  {change.deletions.length > 0 && (
                    <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                      -{change.deletions.length}
                    </Badge>
                  )}
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="bg-muted rounded-md p-3 font-mono text-sm">
                {change.deletions.length > 0 && (
                  <div className="space-y-0.5">
                    {change.deletions.map((line, i) => (
                      <div key={`del-${i}`} className="bg-red-50 text-red-800 px-2 py-0.5 rounded">
                        <span className="text-red-400 mr-2">-</span>
                        {line}
                      </div>
                    ))}
                  </div>
                )}
                {change.additions.length > 0 && (
                  <div className="space-y-0.5 mt-1">
                    {change.additions.map((line, i) => (
                      <div key={`add-${i}`} className="bg-green-50 text-green-800 px-2 py-0.5 rounded">
                        <span className="text-green-400 mr-2">+</span>
                        {line}
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
  )
}
