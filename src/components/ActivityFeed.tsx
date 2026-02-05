import { CollaborationEvent } from '@/lib/types'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  UserPlus, 
  UserMinus, 
  ChatCircle, 
  GitPullRequest,
  PencilSimple,
  CheckCircle 
} from '@phosphor-icons/react'
import { formatDistanceToNow } from 'date-fns'

interface ActivityFeedProps {
  events: CollaborationEvent[]
  maxVisible?: number
}

const eventIcons = {
  user_join: UserPlus,
  user_leave: UserMinus,
  message_sent: ChatCircle,
  pr_created: GitPullRequest,
  pr_updated: CheckCircle,
  typing_start: PencilSimple,
  typing_stop: PencilSimple,
}

const eventLabels = {
  user_join: 'joined',
  user_leave: 'left',
  message_sent: 'sent a message',
  pr_created: 'created a PR',
  pr_updated: 'updated a PR',
  typing_start: 'is typing',
  typing_stop: 'stopped typing',
}

export function ActivityFeed({ events, maxVisible = 10 }: ActivityFeedProps) {
  const recentEvents = events
    .slice(-maxVisible)
    .filter(e => !['typing_start', 'typing_stop'].includes(e.type))
    .reverse()

  if (recentEvents.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No recent activity
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <AnimatePresence mode="popLayout">
        {recentEvents.map((event, index) => {
          const Icon = eventIcons[event.type] || ChatCircle
          const label = eventLabels[event.type] || 'activity'

          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.03 }}
              className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                <Icon size={16} className="text-accent" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="text-sm">
                  <span className="font-medium">{event.userName}</span>
                  {' '}
                  <span className="text-muted-foreground">{label}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {formatDistanceToNow(event.timestamp, { addSuffix: true })}
                </div>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
