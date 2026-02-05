import { PullRequest } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GitPullRequest, CheckCircle, XCircle, Clock } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface PRCardProps {
  pr: PullRequest
  onView: () => void
}

const statusConfig = {
  open: {
    icon: Clock,
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    label: 'Open',
  },
  draft: {
    icon: Clock,
    color: 'bg-gray-50 text-gray-700 border-gray-200',
    label: 'Draft',
  },
  merged: {
    icon: CheckCircle,
    color: 'bg-green-50 text-green-700 border-green-200',
    label: 'Merged',
  },
  closed: {
    icon: XCircle,
    color: 'bg-red-50 text-red-700 border-red-200',
    label: 'Closed',
  },
}

export function PRCard({ pr, onView }: PRCardProps) {
  const config = statusConfig[pr.status]
  const Icon = config.icon

  return (
    <Card className="p-3 sm:p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={onView}>
      <div className="flex items-start gap-2 sm:gap-3">
        <GitPullRequest size={20} weight="duotone" className="text-primary shrink-0 mt-0.5 sm:w-6 sm:h-6" />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start sm:items-center gap-2 mb-1 flex-col sm:flex-row">
            <h3 className="font-semibold text-sm sm:text-base truncate w-full sm:w-auto">{pr.title}</h3>
            <Badge variant="outline" className={cn('text-[10px] sm:text-xs shrink-0 self-start sm:self-auto', config.color)}>
              <Icon size={10} weight="fill" className="mr-1 sm:w-3 sm:h-3" />
              {config.label}
            </Badge>
          </div>
          
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-2">
            {pr.description}
          </p>
          
          <div className="flex items-center flex-wrap gap-2 sm:gap-3 text-[10px] sm:text-xs text-muted-foreground">
            <span>
              {pr.fileChanges.length} file{pr.fileChanges.length !== 1 ? 's' : ''} changed
            </span>
            <span>•</span>
            <span>
              {new Date(pr.createdAt).toLocaleDateString()}
            </span>
            {pr.approvals.length > 0 && (
              <>
                <span>•</span>
                <span className="text-green-600">
                  {pr.approvals.length} approval{pr.approvals.length !== 1 ? 's' : ''}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
