import { EmojiReaction } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface EmojiReactionsDisplayProps {
  reactions: EmojiReaction[]
  currentUserId: string
  onToggle: (emoji: string) => void
}

export function EmojiReactionsDisplay({ 
  reactions, 
  currentUserId, 
  onToggle 
}: EmojiReactionsDisplayProps) {
  if (!reactions || reactions.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1 mt-2">
      <TooltipProvider delayDuration={200}>
        {reactions.map((reaction) => {
          const hasReacted = reaction.userIds.includes(currentUserId)
          const count = reaction.userIds.length
          const tooltipText = reaction.userNames.join(', ')

          return (
            <Tooltip key={reaction.emoji}>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={`h-7 px-2 gap-1 text-sm hover:scale-105 transition-transform ${
                    hasReacted 
                      ? 'bg-accent/50 border-accent-foreground/30' 
                      : 'bg-background'
                  }`}
                  onClick={() => onToggle(reaction.emoji)}
                >
                  <span className="leading-none">{reaction.emoji}</span>
                  <span className="text-xs font-medium">{count}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                <p>{tooltipText}</p>
              </TooltipContent>
            </Tooltip>
          )
        })}
      </TooltipProvider>
    </div>
  )
}
