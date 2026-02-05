import { useState, KeyboardEvent } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { PaperPlaneRight } from '@phosphor-icons/react'

interface ChatInputProps {
  onSend: (message: string) => void
  disabled?: boolean
  placeholder?: string
}

export function ChatInput({ onSend, disabled, placeholder = 'Type your message...' }: ChatInputProps) {
  const [message, setMessage] = useState('')

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim())
      setMessage('')
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex gap-2 p-3 md:p-4 border-t bg-card">
      <Textarea
        id="chat-message-input"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="min-h-[50px] md:min-h-[60px] max-h-[150px] md:max-h-[200px] resize-none text-sm md:text-base"
        rows={2}
      />
      <Button
        onClick={handleSend}
        disabled={!message.trim() || disabled}
        size="icon"
        className="h-[50px] w-[50px] md:h-[60px] md:w-[60px] shrink-0 transition-transform hover:scale-105 active:scale-95"
      >
        <PaperPlaneRight size={18} weight="fill" className="md:w-5 md:h-5" />
      </Button>
    </div>
  )
}
