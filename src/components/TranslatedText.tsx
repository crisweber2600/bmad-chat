import { useState } from 'react'
import { TranslatedSegment } from '@/lib/types'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Info } from '@phosphor-icons/react'

interface TranslatedTextProps {
  originalText: string
  segments: TranslatedSegment[]
}

export function TranslatedText({ originalText, segments }: TranslatedTextProps) {
  const [activeSegment, setActiveSegment] = useState<string | null>(null)

  if (!segments || segments.length === 0) {
    return <span>{originalText}</span>
  }

  const sortedSegments = [...segments].sort((a, b) => a.startIndex - b.startIndex)
  
  const renderSegments = () => {
    const parts: React.ReactElement[] = []
    let currentIndex = 0

    sortedSegments.forEach((segment, idx) => {
      if (currentIndex < segment.startIndex) {
        parts.push(
          <span key={`text-${currentIndex}`}>
            {originalText.slice(currentIndex, segment.startIndex)}
          </span>
        )
      }

      const segmentId = `segment-${idx}`
      const isActive = activeSegment === segmentId

      parts.push(
        <TooltipProvider key={segmentId} delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className="relative cursor-help underline decoration-accent decoration-2 underline-offset-2 hover:bg-accent/10 transition-colors rounded px-0.5"
                onMouseEnter={() => setActiveSegment(segmentId)}
                onMouseLeave={() => setActiveSegment(null)}
              >
                {segment.simplifiedText || segment.originalText}
                <Info
                  size={12}
                  weight="fill"
                  className="inline-block ml-1 text-accent align-super"
                />
              </span>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              align="start"
              className="max-w-xs md:max-w-md p-4 space-y-2"
              sideOffset={8}
            >
              {segment.simplifiedText && segment.simplifiedText !== segment.originalText && (
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-muted-foreground">Original:</div>
                  <div className="text-sm italic">{segment.originalText}</div>
                </div>
              )}
              <div className="space-y-1">
                <div className="text-xs font-semibold text-muted-foreground">Explanation:</div>
                <div className="text-sm">{segment.explanation}</div>
              </div>
              {segment.context && (
                <div className="space-y-1 pt-2 border-t">
                  <div className="text-xs font-semibold text-muted-foreground">Context:</div>
                  <div className="text-sm">{segment.context}</div>
                </div>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )

      currentIndex = segment.endIndex
    })

    if (currentIndex < originalText.length) {
      parts.push(
        <span key={`text-${currentIndex}`}>
          {originalText.slice(currentIndex)}
        </span>
      )
    }

    return parts
  }

  return <span className="inline">{renderSegments()}</span>
}
