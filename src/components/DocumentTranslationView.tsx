import { useState } from 'react'
import { FileChange, UserRole } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Translate, X, UserGear, Briefcase } from '@phosphor-icons/react'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Info } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface TranslatedDocSegment {
  lineNumber: number
  originalText: string
  explanation: string
  context: string
  simplifiedText?: string
}

interface DocumentTranslationViewProps {
  fileChange: FileChange
  userRole: UserRole
  onClose: () => void
}

export function DocumentTranslationView({ fileChange, userRole, onClose }: DocumentTranslationViewProps) {
  const [translations, setTranslations] = useState<TranslatedDocSegment[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isTranslated, setIsTranslated] = useState(false)

  const handleTranslate = async () => {
    setIsLoading(true)
    try {
      const roleDescription = userRole === 'business'
        ? 'a business user who needs plain language explanations without technical jargon'
        : 'a technical user who needs detailed implementation specifics and technical accuracy'

      const allLines = [
        ...fileChange.additions.map((line, idx) => ({ line, number: idx + 1, type: 'addition' })),
        ...fileChange.deletions.map((line, idx) => ({ line, number: idx + 1, type: 'deletion' }))
      ]

      const documentContent = allLines.map((l, idx) => `Line ${idx + 1}: ${l.line}`).join('\n')

      const promptText = `You are a translator that helps ${roleDescription} understand technical documentation.

Analyze the following documentation file and identify lines that need explanation for a ${userRole} user:

File: ${fileChange.path}

${documentContent}

For each line that contains technical terms, API references, code snippets, or jargon:
1. Note the line number
2. Provide a clear explanation appropriate for a ${userRole} user
3. Give context about why it matters in the larger project
4. Optionally provide a simplified version of the text

${userRole === 'business' 
  ? 'Focus on business impact, user benefits, and outcomes. Explain what features mean to end users.' 
  : 'Focus on implementation details, APIs, architecture decisions, and technical specifications.'}

Return a JSON object with this exact structure:
{
  "translations": [
    {
      "lineNumber": 1,
      "originalText": "the exact line text that needs explanation",
      "explanation": "clear explanation for ${userRole} user",
      "context": "why this matters in the project",
      "simplifiedText": "optional simplified version (only if significantly clearer for ${userRole} users)"
    }
  ]
}

Important: 
- Only include lines that genuinely need explanation for a ${userRole} user
- If nothing needs explanation, return an empty translations array
- Focus on the most important 5-10 items that would help understanding`

      const response = await window.spark.llm(promptText, 'gpt-4o', true)
      const parsed = JSON.parse(response)

      setTranslations(parsed.translations || [])
      setIsTranslated(true)

      if (parsed.translations && parsed.translations.length > 0) {
        toast.success(`Translated ${parsed.translations.length} line${parsed.translations.length > 1 ? 's' : ''} for ${userRole} context`)
      } else {
        toast.info('No lines needed translation')
      }
    } catch (error) {
      toast.error('Failed to translate document')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const renderLine = (line: string, lineNumber: number, type: 'addition' | 'deletion') => {
    const translation = translations.find(t => t.lineNumber === lineNumber)

    if (!translation) {
      return (
        <div
          key={`${type}-${lineNumber}`}
          className={`flex gap-2 text-sm font-mono px-3 py-1 ${
            type === 'addition' ? 'bg-green-50 text-green-900' : 'bg-red-50 text-red-900'
          }`}
        >
          <span className="text-muted-foreground select-none w-8 text-right shrink-0">
            {lineNumber}
          </span>
          <span className="select-none w-4 shrink-0">
            {type === 'addition' ? '+' : '-'}
          </span>
          <span className="flex-1 break-all">{line}</span>
        </div>
      )
    }

    return (
      <div
        key={`${type}-${lineNumber}`}
        className={`flex gap-2 text-sm font-mono px-3 py-1 ${
          type === 'addition' ? 'bg-green-50 text-green-900' : 'bg-red-50 text-red-900'
        }`}
      >
        <span className="text-muted-foreground select-none w-8 text-right shrink-0">
          {lineNumber}
        </span>
        <span className="select-none w-4 shrink-0">
          {type === 'addition' ? '+' : '-'}
        </span>
        <div className="flex-1">
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="relative cursor-help underline decoration-accent decoration-2 underline-offset-2 hover:bg-accent/10 transition-colors rounded px-0.5 break-all">
                  {translation.simplifiedText || translation.originalText}
                  <Info
                    size={12}
                    weight="fill"
                    className="inline-block ml-1 text-accent align-super"
                  />
                </span>
              </TooltipTrigger>
              <TooltipContent
                side="right"
                align="start"
                className="max-w-xs md:max-w-md p-4 space-y-2"
                sideOffset={8}
              >
                {translation.simplifiedText && translation.simplifiedText !== translation.originalText && (
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-muted-foreground">Original:</div>
                    <div className="text-sm italic font-mono">{translation.originalText}</div>
                  </div>
                )}
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-muted-foreground">Explanation:</div>
                  <div className="text-sm">{translation.explanation}</div>
                </div>
                {translation.context && (
                  <div className="space-y-1 pt-2 border-t">
                    <div className="text-xs font-semibold text-muted-foreground">Context:</div>
                    <div className="text-sm">{translation.context}</div>
                  </div>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    )
  }

  return (
    <Card className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Translate size={18} weight="duotone" />
              {fileChange.path}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {userRole === 'business' ? (
                  <>
                    <Briefcase size={12} className="mr-1" />
                    Business View
                  </>
                ) : (
                  <>
                    <UserGear size={12} className="mr-1" />
                    Technical View
                  </>
                )}
              </Badge>
              {isTranslated && translations.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {translations.length} line{translations.length > 1 ? 's' : ''} explained
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isTranslated && (
            <Button
              variant="default"
              size="sm"
              onClick={handleTranslate}
              disabled={isLoading}
              className="gap-2"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Translating...
                </>
              ) : (
                <>
                  <Translate size={16} />
                  Translate for {userRole}
                </>
              )}
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={18} />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="divide-y">
          {fileChange.additions.map((line, idx) => 
            renderLine(line, idx + 1, 'addition')
          )}
          {fileChange.deletions.map((line, idx) => 
            renderLine(line, idx + 1, 'deletion')
          )}
        </div>
        {!isTranslated && (
          <div className="p-8 text-center text-muted-foreground text-sm">
            Click "Translate for {userRole}" to get explanations tailored to your role
          </div>
        )}
      </ScrollArea>
    </Card>
  )
}
