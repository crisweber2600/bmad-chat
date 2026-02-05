import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Smiley } from '@phosphor-icons/react'

const QUICK_REACTIONS = ['👍', '👎', '😄', '🎉', '❤️', '🚀', '👀', '🤔']

interface EmojiReactionPickerProps {
  onSelect: (emoji: string) => void
  className?: string
}

export function EmojiReactionPicker({ onSelect, className }: EmojiReactionPickerProps) {
  const [open, setOpen] = useState(false)

  const handleSelect = (emoji: string) => {
    onSelect(emoji)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`h-7 px-2 text-xs ${className}`}
        >
          <Smiley size={14} className="mr-1" />
          React
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start">
        <div className="flex gap-1 flex-wrap max-w-[200px]">
          {QUICK_REACTIONS.map((emoji) => (
            <Button
              key={emoji}
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0 text-lg hover:scale-110 transition-transform"
              onClick={() => handleSelect(emoji)}
            >
              {emoji}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
