import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { 
  TrendUp, 
  TrendDown, 
  Lightning, 
  CheckCircle, 
  Clock, 
  ArrowRight,
  Rocket,
  Target,
  Users
} from '@phosphor-icons/react'
import { Chat, PullRequest, User } from '@/lib/types'
import { motion } from 'framer-motion'

interface MomentumDashboardProps {
  chats: Chat[]
  pullRequests: PullRequest[]
  currentUser: User
  onNewChat: () => void
  onSelectChat: (chatId: string) => void
  onViewPR: (pr: PullRequest) => void
}

export function MomentumDashboard({
  chats,
  pullRequests,
  currentUser,
  onNewChat,
  onSelectChat,
  onViewPR,
}: MomentumDashboardProps) {
  const calculateMomentum = () => {
    const now = Date.now()
    const oneDayAgo = now - 24 * 60 * 60 * 1000
    const threeDaysAgo = now - 3 * 24 * 60 * 60 * 1000
    
    const recentMessages = chats.reduce((count, chat) => {
      return count + chat.messages.filter(m => m.timestamp > oneDayAgo).length
    }, 0)
    
    const recentDecisions = pullRequests.filter(pr => 
      pr.createdAt > threeDaysAgo || pr.updatedAt > threeDaysAgo
    ).length
    
    const velocity = recentMessages / 24
    
    return {
      decisionsToday: recentMessages,
      decisionsPending: pullRequests.filter(pr => pr.status === 'open').length,
      velocity: velocity.toFixed(1),
      trend: velocity > 2 ? 'up' : velocity > 0.5 ? 'stable' : 'down',
    }
  }

  const getProgressNarrative = () => {
    const totalChats = chats.length
    const totalPRs = pullRequests.length
    const mergedPRs = pullRequests.filter(pr => pr.status === 'merged').length
    const openPRs = pullRequests.filter(pr => pr.status === 'open').length
    
    if (totalChats === 0) {
      return {
        title: "Ready to begin your journey",
        story: `Welcome ${currentUser.name}! Start your first conversation to define your project vision and let BMAD guide you through the process.`,
        stage: 'Pioneer',
        progress: 0,
      }
    }
    
    if (totalPRs === 0) {
      return {
        title: "Building momentum",
        story: `You've started ${totalChats} conversation${totalChats > 1 ? 's' : ''} exploring your ideas. Keep the dialogue going to crystallize decisions into actionable specifications.`,
        stage: 'Exploration',
        progress: 20,
      }
    }
    
    if (mergedPRs === 0) {
      return {
        title: "Decisions forming",
        story: `${openPRs} decision${openPRs > 1 ? 's are' : ' is'} awaiting review. You're transforming conversations into concrete commitments. Review and merge to lock in your direction.`,
        stage: 'Formation',
        progress: 45,
      }
    }
    
    const completionRate = (mergedPRs / totalPRs) * 100
    
    if (completionRate < 50) {
      return {
        title: "Gaining clarity",
        story: `${mergedPRs} decision${mergedPRs > 1 ? 's' : ''} merged, ${openPRs} pending. Your project architecture is taking shape. Each merged decision builds a stronger foundation.`,
        stage: 'Establishment',
        progress: 60,
      }
    }
    
    return {
      title: "Strong forward motion",
      story: `Excellent progress with ${mergedPRs} merged decisions. Your team is aligned and executing with clarity. Keep this momentum to reach your next milestone.`,
      stage: 'Growth',
      progress: 80,
    }
  }

  const getNextAction = () => {
    const openPRs = pullRequests.filter(pr => pr.status === 'open')
    const recentChats = [...chats].sort((a, b) => b.updatedAt - a.updatedAt)
    
    if (openPRs.length > 0) {
      const oldestPR = openPRs.sort((a, b) => a.createdAt - b.createdAt)[0]
      const hoursWaiting = ((Date.now() - oldestPR.createdAt) / (1000 * 60 * 60)).toFixed(0)
      
      return {
        type: 'review-pr',
        title: 'Review pending decision',
        description: `"${oldestPR.title}" has been waiting ${hoursWaiting}h. ${currentUser.role === 'technical' ? 'Your approval moves the project forward.' : 'Review the proposed changes and provide feedback.'}`,
        action: () => onViewPR(oldestPR),
        actionLabel: 'Review Now',
        urgency: parseInt(hoursWaiting) > 24 ? 'high' : 'medium',
      }
    }
    
    if (recentChats.length > 0) {
      const activeChat = recentChats[0]
      const lastMessage = activeChat.messages[activeChat.messages.length - 1]
      
      if (lastMessage?.role === 'assistant' && lastMessage.fileChanges && lastMessage.fileChanges.length > 0) {
        return {
          type: 'create-pr',
          title: 'Document suggested changes',
          description: `Your recent conversation in "${activeChat.title}" generated ${lastMessage.fileChanges.length} change${lastMessage.fileChanges.length > 1 ? 's' : ''}. Create a PR to formalize these decisions.`,
          action: () => onSelectChat(activeChat.id),
          actionLabel: 'Create PR',
          urgency: 'medium',
        }
      }
      
      return {
        type: 'continue',
        title: 'Continue the conversation',
        description: `Pick up where you left off in "${activeChat.title}" to drive more clarity and decisions.`,
        action: () => onSelectChat(activeChat.id),
        actionLabel: 'Continue',
        urgency: 'low',
      }
    }
    
    return {
      type: 'start',
      title: 'Start your first conversation',
      description: currentUser.role === 'business' 
        ? 'Describe your business vision, target users, and key problems you want to solve. BMAD will help translate this into technical architecture.'
        : 'Define technical architecture, system boundaries, and integration points. BMAD will connect this to business objectives.',
      action: onNewChat,
      actionLabel: 'New Conversation',
      urgency: 'low',
    }
  }

  const momentum = calculateMomentum()
  const narrative = getProgressNarrative()
  const nextAction = getNextAction()

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-4 md:p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-3 mb-2">
          <Rocket size={32} weight="duotone" className="text-accent" />
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            {narrative.title}
          </h1>
        </div>
        
        <p className="text-lg text-muted-foreground leading-relaxed mb-4">
          {narrative.story}
        </p>
        
        <div className="flex items-center gap-4 mb-4">
          <Badge variant="outline" className="text-sm px-3 py-1">
            <Target size={14} className="mr-1" />
            Stage: {narrative.stage}
          </Badge>
          <div className="flex-1 max-w-xs">
            <Progress value={narrative.progress} className="h-2" />
          </div>
          <span className="text-sm text-muted-foreground">{narrative.progress}%</span>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Lightning size={24} weight="duotone" className="text-accent" />
                <h3 className="font-semibold">Velocity</h3>
              </div>
              {momentum.trend === 'up' && <TrendUp size={20} className="text-green-500" weight="bold" />}
              {momentum.trend === 'down' && <TrendDown size={20} className="text-red-500" weight="bold" />}
            </div>
            <div className="text-3xl font-bold mb-1">{momentum.velocity}</div>
            <div className="text-sm text-muted-foreground">decisions per hour</div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle size={24} weight="duotone" className="text-green-500" />
              <h3 className="font-semibold">Today</h3>
            </div>
            <div className="text-3xl font-bold mb-1">{momentum.decisionsToday}</div>
            <div className="text-sm text-muted-foreground">decisions made</div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={24} weight="duotone" className="text-amber-500" />
              <h3 className="font-semibold">Queue</h3>
            </div>
            <div className="text-3xl font-bold mb-1">{momentum.decisionsPending}</div>
            <div className="text-sm text-muted-foreground">awaiting review</div>
          </Card>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <ArrowRight size={24} weight="duotone" className="text-primary" />
            <h2 className="text-xl font-semibold">Next Action</h2>
          </div>
          
          <Separator className="mb-4" />
          
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-lg">{nextAction.title}</h3>
                {nextAction.urgency === 'high' && (
                  <Badge variant="destructive" className="text-xs">Urgent</Badge>
                )}
                {nextAction.urgency === 'medium' && (
                  <Badge variant="secondary" className="text-xs">Important</Badge>
                )}
              </div>
              <p className="text-muted-foreground mb-4">{nextAction.description}</p>
            </div>
            
            <div className="flex gap-3">
              <Button onClick={nextAction.action} size="lg" className="gap-2">
                {nextAction.actionLabel}
                <ArrowRight size={18} weight="bold" />
              </Button>
              
              {nextAction.type !== 'start' && (
                <>
                  <Button variant="outline" onClick={onNewChat} size="lg">
                    Skip - New Topic
                  </Button>
                  <Button variant="ghost" size="lg">
                    Get Help
                  </Button>
                </>
              )}
            </div>
          </div>
        </Card>
      </motion.div>

      {currentUser.role === 'business' && chats.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card className="p-6 bg-accent/5 border-accent/20">
            <div className="flex items-start gap-3">
              <Users size={24} weight="duotone" className="text-accent mt-1" />
              <div>
                <h3 className="font-semibold mb-2">Collaboration Status</h3>
                <p className="text-sm text-muted-foreground">
                  Your technical co-founder has {pullRequests.filter(pr => pr.status === 'open').length} decision{pullRequests.filter(pr => pr.status === 'open').length !== 1 ? 's' : ''} to review.
                  {pullRequests.filter(pr => pr.status === 'open').length > 3 && 
                    ' Consider scheduling a sync to unblock and align on priorities.'
                  }
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
