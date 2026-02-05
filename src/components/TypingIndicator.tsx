import { UserPresence } from '@/lib/types'
import { motion, AnimatePresence } from 'framer-motion'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface TypingIndicatorProps {
  typingUsers: UserPresence[]
}

export function TypingIndicator({ typingUsers }: TypingIndicatorProps) {
  if (typingUsers.length === 0) return null

  const displayNames = typingUsers.map(u => u.userName)
  const text = 
    displayNames.length === 1
      ? `${displayNames[0]} is typing...`
      : displayNames.length === 2
      ? `${displayNames[0]} and ${displayNames[1]} are typing...`
      : `${displayNames[0]} and ${displayNames.length - 1} others are typing...`

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.2 }}
        className="flex gap-3 mb-4"
      >
        <div className="flex -space-x-2">
          {typingUsers.slice(0, 3).map((user) => (
            <Avatar key={user.userId} className="h-7 w-7 border-2 border-background">
              <AvatarImage src={user.avatarUrl} />
              <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                {user.userName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ))}
        </div>
        
        <div className="flex flex-col gap-1">
          <div className="text-xs text-muted-foreground">{text}</div>
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-accent"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
