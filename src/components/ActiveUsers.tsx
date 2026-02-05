import { UserPresence } from '@/lib/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { motion, AnimatePresence } from 'framer-motion'
import { Circle } from '@phosphor-icons/react'

interface ActiveUsersProps {
  users: UserPresence[]
  maxVisible?: number
}

export function ActiveUsers({ users, maxVisible = 5 }: ActiveUsersProps) {
  const visibleUsers = users.slice(0, maxVisible)
  const remainingCount = users.length - maxVisible

  if (users.length === 0) return null

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        <div className="flex -space-x-2">
          <AnimatePresence mode="popLayout">
            {visibleUsers.map((user, index) => (
              <motion.div
                key={user.userId}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ delay: index * 0.05 }}
                style={{ zIndex: visibleUsers.length - index }}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="relative">
                      <Avatar className="h-8 w-8 border-2 border-background ring-2 ring-accent/20 transition-transform hover:scale-110 hover:z-50">
                        <AvatarImage src={user.avatarUrl} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {user.userName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <motion.div
                        className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-accent border-2 border-background"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: index * 0.05 + 0.1 }}
                      >
                        <motion.div
                          className="h-full w-full rounded-full bg-accent"
                          animate={{
                            scale: [1, 1.2, 1],
                            opacity: [1, 0.7, 1],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                        />
                      </motion.div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-sm">
                      <div className="font-medium">{user.userName}</div>
                      {user.isTyping && user.typingChatId && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Circle size={8} weight="fill" className="text-accent animate-pulse" />
                          Typing...
                        </div>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        
        {remainingCount > 0 && (
          <Badge variant="secondary" className="text-xs">
            +{remainingCount} more
          </Badge>
        )}
      </div>
    </TooltipProvider>
  )
}
