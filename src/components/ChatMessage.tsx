import { Message, User } from '@/lib/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { User as UserIcon, UserGear, Briefcase } from '@phosphor-icons/react'
import { motion } from 'framer-motion'

interface ChatMessageProps {
  message: Message
  user?: User
}

export function ChatMessage({ message, user }: ChatMessageProps) {
  const isUser = message.role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn(
        'flex gap-2 sm:gap-3 mb-3 sm:mb-4',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      <Avatar className="h-8 w-8 sm:h-9 sm:w-9 shrink-0">
        <AvatarImage src={user?.avatarUrl} />
        <AvatarFallback className={cn(isUser ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
          {isUser ? (
            user?.role === 'technical' ? (
              <UserGear size={16} weight="duotone" className="sm:w-[18px] sm:h-[18px]" />
            ) : (
              <Briefcase size={16} weight="duotone" className="sm:w-[18px] sm:h-[18px]" />
            )
          ) : (
            <UserIcon size={16} weight="duotone" className="sm:w-[18px] sm:h-[18px]" />
          )}
        </AvatarFallback>
      </Avatar>

      <div className={cn('flex flex-col gap-1 max-w-[85%] sm:max-w-[75%]', isUser ? 'items-end' : 'items-start')}>
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm font-medium">
            {isUser ? user?.name || 'You' : 'AI Assistant'}
          </span>
          {user?.role && isUser && (
            <Badge variant="outline" className="text-[10px] sm:text-xs py-0 h-4 sm:h-5">
              {user.role}
            </Badge>
          )}
        </div>

        <div
          className={cn(
            'rounded-lg px-3 py-2 sm:px-4 sm:py-2.5 text-sm sm:text-[15px] leading-relaxed break-words',
            isUser
              ? 'bg-accent text-accent-foreground'
              : 'bg-muted text-foreground'
          )}
        >
          {message.content}
        </div>

        <span className="text-[10px] sm:text-xs text-muted-foreground">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
    </motion.div>
  )
}
