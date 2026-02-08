import { useCallback, useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import {
  DecisionConflict,
  DecisionOption,
  DecisionRecord,
  DecisionStage,
  DecisionType,
  DecisionValue,
  DecisionVersion,
} from '@/lib/types'
import {
  Plus,
  Trash,
  ArrowRight,
  CheckCircle,
  Lock,
  LockOpen,
  ThumbsUp,
  Clock,
  Zap,
  Trophy,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { toast } from 'sonner'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface DecisionCenterPanelProps {
  activeChat: string | null
  decisions: DecisionRecord[]
  isLoading: boolean
  currentUserId?: string
  onRefresh: () => Promise<void>
  onCreateDecision: (
    question: string,
    options: string[],
    decisionType: DecisionType,
    context?: string
  ) => Promise<void>
  onVoteOnOption: (decision: DecisionRecord, optionId: string, userId: string) => Promise<void>
  onChangeStage: (
    decision: DecisionRecord,
    stage: DecisionStage,
    resolvedOptionId?: string
  ) => Promise<void>
  onLockDecision: (decisionId: string) => Promise<void>
  onUnlockDecision: (decisionId: string) => Promise<void>
  onGetHistory: (decisionId: string) => Promise<DecisionVersion[]>
  onGetConflicts: (decisionId: string) => Promise<DecisionConflict[]>
  onResolveConflict: (
    decisionId: string,
    conflictId: string,
    resolution: string
  ) => Promise<void>
}

// ---------------------------------------------------------------------------
// Stage badge config
// ---------------------------------------------------------------------------

const stageConfig: Record<
  DecisionStage,
  { color: string; label: string; Icon: typeof Clock }
> = {
  proposed: {
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    label: 'Proposed',
    Icon: Clock,
  },
  active: {
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    label: 'Active',
    Icon: Zap,
  },
  resolved: {
    color: 'bg-green-100 text-green-800 border-green-300',
    label: 'Resolved',
    Icon: Trophy,
  },
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getDecisionValue(decision: DecisionRecord): DecisionValue | null {
  const v = decision.value
  if (v && typeof v === 'object' && 'question' in v && 'options' in v) {
    return v as unknown as DecisionValue
  }
  return null
}

function getStage(decision: DecisionRecord): DecisionStage {
  const v = getDecisionValue(decision)
  return v?.stage ?? 'proposed'
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function OptionRow({
  option,
  totalVotes,
  isResolved,
  isWinner,
  hasVoted,
  onVote,
}: {
  option: DecisionOption
  totalVotes: number
  isResolved: boolean
  isWinner: boolean
  hasVoted: boolean
  onVote: () => void
}) {
  const pct = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0
  return (
    <div
      className={`relative rounded-md border p-2.5 transition-colors ${
        isWinner ? 'border-green-400 bg-green-50' : ''
      } ${!isResolved ? 'cursor-pointer hover:bg-accent/50' : ''}`}
      onClick={!isResolved ? onVote : undefined}
      tabIndex={!isResolved ? 0 : undefined}
      onKeyDown={
        !isResolved
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') onVote()
            }
          : undefined
      }
    >
      {/* Progress bar background */}
      <div
        className="absolute inset-0 rounded-md bg-primary/5 transition-all"
        style={{ width: `${pct}%` }}
      />

      <div className="relative flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {hasVoted && (
            <ThumbsUp className="h-3.5 w-3.5 text-primary shrink-0" />
          )}
          {isWinner && (
            <CheckCircle className="h-3.5 w-3.5 text-green-600 shrink-0" />
          )}
          <span className="text-sm truncate">{option.label}</span>
        </div>
        <div className="text-xs text-muted-foreground shrink-0">
          {option.votes} vote{option.votes !== 1 ? 's' : ''} · {pct}%
        </div>
      </div>
    </div>
  )
}

function DecisionCard({
  decision,
  currentUserId,
  onVote,
  onChangeStage,
  onLock,
  onUnlock,
  onViewDetails,
}: {
  decision: DecisionRecord
  currentUserId: string
  onVote: (optionId: string) => void
  onChangeStage: (stage: DecisionStage, resolvedOptionId?: string) => void
  onLock: () => void
  onUnlock: () => void
  onViewDetails: () => void
}) {
  const dv = getDecisionValue(decision)
  const stage = getStage(decision)
  const cfg = stageConfig[stage]
  const totalVotes = dv
    ? dv.options.reduce((sum, o) => sum + o.votes, 0)
    : 0

  return (
    <Card className="p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm leading-tight truncate">
            {dv?.question ?? decision.title}
          </h4>
          {dv?.context && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
              {dv.context}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Badge
            variant="outline"
            className={`text-[10px] ${cfg.color}`}
          >
            <cfg.Icon className="h-3 w-3 mr-0.5" />
            {cfg.label}
          </Badge>
          {decision.isLocked && (
            <Badge variant="destructive" className="text-[10px]">
              <Lock className="h-3 w-3 mr-0.5" />
              Locked
            </Badge>
          )}
          {decision.openConflictCount > 0 && (
            <Badge variant="secondary" className="text-[10px]">
              {decision.openConflictCount} conflict
              {decision.openConflictCount > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </div>

      {/* Options list */}
      {dv && dv.options.length > 0 && (
        <div className="space-y-1.5">
          {dv.options.map((opt) => (
            <OptionRow
              key={opt.id}
              option={opt}
              totalVotes={totalVotes}
              isResolved={stage === 'resolved'}
              isWinner={
                stage === 'resolved' && dv.resolvedOptionId === opt.id
              }
              hasVoted={opt.voters.includes(currentUserId)}
              onVote={() => onVote(opt.id)}
            />
          ))}
        </div>
      )}

      {/* Fallback for legacy raw-value decisions */}
      {!dv && (
        <div className="text-xs text-muted-foreground font-mono bg-muted/50 rounded p-2 overflow-auto max-h-24">
          {JSON.stringify(decision.value, null, 2)}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap pt-1">
        {stage === 'proposed' && (
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-7"
            onClick={() => onChangeStage('active')}
          >
            <ArrowRight className="h-3.5 w-3.5 mr-1" />
            Activate
          </Button>
        )}
        {stage === 'active' && dv && (
          <ResolveDropdown options={dv.options} onResolve={(optId) => onChangeStage('resolved', optId)} />
        )}
        {decision.isLocked ? (
          <Button variant="ghost" size="sm" className="text-xs h-7" onClick={onUnlock}>
            <LockOpen className="h-3.5 w-3.5 mr-1" />
            Unlock
          </Button>
        ) : (
          <Button variant="ghost" size="sm" className="text-xs h-7" onClick={onLock}>
            <Lock className="h-3.5 w-3.5 mr-1" />
            Lock
          </Button>
        )}
        <Button variant="ghost" size="sm" className="text-xs h-7 ml-auto" onClick={onViewDetails}>
          Details
        </Button>
      </div>
    </Card>
  )
}

function ResolveDropdown({
  options,
  onResolve,
}: {
  options: DecisionOption[]
  onResolve: (optionId: string) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        className="text-xs h-7"
        onClick={() => setOpen(!open)}
      >
        <CheckCircle className="h-3.5 w-3.5 mr-1" />
        Resolve
        {open ? (
          <ChevronDown className="h-3 w-3 ml-1" />
        ) : (
          <ChevronRight className="h-3 w-3 ml-1" />
        )}
      </Button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-10 bg-popover border rounded-md shadow-md p-1 min-w-[160px]">
          <div className="text-[10px] text-muted-foreground px-2 py-1">
            Select winning option:
          </div>
          {options.map((opt) => (
            <button
              key={opt.id}
              className="w-full text-left text-sm px-2 py-1.5 rounded hover:bg-accent transition-colors"
              onClick={() => {
                onResolve(opt.id)
                setOpen(false)
              }}
            >
              {opt.label}{' '}
              <span className="text-muted-foreground text-xs">
                ({opt.votes} vote{opt.votes !== 1 ? 's' : ''})
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function DetailsPanel({
  decision,
  history,
  conflicts,
  resolutionText,
  onResolutionTextChange,
  onResolveConflict,
  onRefreshConflicts,
}: {
  decision: DecisionRecord
  history: DecisionVersion[]
  conflicts: DecisionConflict[]
  resolutionText: string
  onResolutionTextChange: (text: string) => void
  onResolveConflict: (conflictId: string) => Promise<void>
  onRefreshConflicts: () => Promise<void>
}) {
  return (
    <div className="mt-4 border rounded-lg p-4 space-y-4 bg-card">
      <h4 className="font-semibold text-sm">
        Details — {getDecisionValue(decision)?.question ?? decision.title}
      </h4>

      {/* Version history */}
      <div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
          Version History
        </div>
        <div className="space-y-1.5">
          {history.map((version) => (
            <div key={version.id} className="rounded border p-2 text-xs">
              <div className="flex justify-between">
                <span className="font-medium">v{version.versionNumber}</span>
                <span className="text-muted-foreground">
                  {new Date(version.changedAt).toLocaleString()}
                </span>
              </div>
              <div className="text-muted-foreground mt-0.5">
                {version.reason || 'No reason'}
              </div>
            </div>
          ))}
          {history.length === 0 && (
            <div className="text-xs text-muted-foreground">
              No version history.
            </div>
          )}
        </div>
      </div>

      {/* Conflicts */}
      <div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
          Conflicts
        </div>
        <div className="space-y-2">
          {conflicts.map((conflict) => (
            <div
              key={conflict.id}
              className="rounded border p-2 text-xs space-y-1.5"
            >
              <div className="flex justify-between items-start">
                <span className="font-medium">{conflict.conflictType}</span>
                <Badge
                  variant={
                    conflict.status === 'resolved' ? 'outline' : 'secondary'
                  }
                  className="text-[10px]"
                >
                  {conflict.status}
                </Badge>
              </div>
              <div className="text-muted-foreground">
                {conflict.description}
              </div>
              {conflict.status !== 'resolved' && (
                <div className="flex gap-2 items-center">
                  <Input
                    className="text-xs h-7 flex-1"
                    value={resolutionText}
                    onChange={(e) => onResolutionTextChange(e.target.value)}
                    placeholder="Resolution..."
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={async () => {
                      await onResolveConflict(conflict.id)
                      await onRefreshConflicts()
                    }}
                  >
                    Resolve
                  </Button>
                </div>
              )}
            </div>
          ))}
          {conflicts.length === 0 && (
            <div className="text-xs text-muted-foreground">No conflicts.</div>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Create Decision Dialog
// ---------------------------------------------------------------------------

function CreateDecisionDialog({
  onSubmit,
}: {
  onSubmit: (
    question: string,
    options: string[],
    decisionType: DecisionType,
    context?: string
  ) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState<string[]>(['', ''])
  const [decisionType, setDecisionType] = useState<DecisionType>('poll')
  const [context, setContext] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const reset = () => {
    setQuestion('')
    setOptions(['', ''])
    setDecisionType('poll')
    setContext('')
  }

  const addOption = () => setOptions((prev) => [...prev, ''])

  const removeOption = (index: number) => {
    if (options.length <= 2) return
    setOptions((prev) => prev.filter((_, i) => i !== index))
  }

  const updateOption = (index: number, value: string) => {
    setOptions((prev) => prev.map((o, i) => (i === index ? value : o)))
  }

  const handleSubmit = async () => {
    const trimmedQ = question.trim()
    const validOptions = options.map((o) => o.trim()).filter(Boolean)
    if (!trimmedQ) {
      toast.error('Question is required')
      return
    }
    if (validOptions.length < 2) {
      toast.error('At least 2 options are required')
      return
    }
    setIsSubmitting(true)
    try {
      await onSubmit(
        trimmedQ,
        validOptions,
        decisionType,
        context.trim() || undefined
      )
      reset()
      setOpen(false)
    } catch {
      toast.error('Failed to create decision')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          New Decision
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Create Decision</DialogTitle>
          <DialogDescription>
            Pose a question with options for the team to vote on.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <label className="text-sm font-medium" htmlFor="dc-question">
              Question
            </label>
            <Input
              id="dc-question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What should we decide?"
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Options</label>
            <div className="space-y-2 mt-1">
              {options.map((opt, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={opt}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="flex-1"
                  />
                  {options.length > 2 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={() => removeOption(index)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={addOption}
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Option
              </Button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium" htmlFor="dc-type">
              Decision Type
            </label>
            <select
              id="dc-type"
              value={decisionType}
              onChange={(e) =>
                setDecisionType(e.target.value as DecisionType)
              }
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="poll">Poll — majority vote</option>
              <option value="consensus">Consensus — agreement needed</option>
              <option value="authority">Authority — owner decides</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium" htmlFor="dc-context">
              Context (optional)
            </label>
            <Textarea
              id="dc-context"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Additional context..."
              rows={2}
              className="mt-1"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              reset()
              setOpen(false)
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function DecisionCenterPanel({
  activeChat,
  decisions,
  isLoading,
  currentUserId,
  onRefresh,
  onCreateDecision,
  onVoteOnOption,
  onChangeStage,
  onLockDecision,
  onUnlockDecision,
  onGetHistory,
  onGetConflicts,
  onResolveConflict,
}: DecisionCenterPanelProps) {
  // Warn once if currentUserId is missing or a placeholder
  useEffect(() => {
    if (!currentUserId || currentUserId === 'current-user') {
      console.warn(
        '[DecisionCenterPanel] currentUserId is missing or set to placeholder — votes will not be recorded correctly'
      )
    }
  }, [currentUserId])

  const safeUserId = currentUserId || 'anonymous'

  const [selectedDecisionId, setSelectedDecisionId] = useState<string | null>(
    null
  )
  const [history, setHistory] = useState<DecisionVersion[]>([])
  const [conflicts, setConflicts] = useState<DecisionConflict[]>([])
  const [resolutionText, setResolutionText] = useState(
    'Aligned on latest context'
  )
  const [filterStage, setFilterStage] = useState<DecisionStage | 'all'>('all')

  const handleViewDetails = useCallback(
    async (decisionId: string) => {
      setSelectedDecisionId(
        selectedDecisionId === decisionId ? null : decisionId
      )
      if (selectedDecisionId === decisionId) return
      const [h, c] = await Promise.all([
        onGetHistory(decisionId),
        onGetConflicts(decisionId),
      ])
      setHistory(h)
      setConflicts(c)
    },
    [selectedDecisionId, onGetHistory, onGetConflicts]
  )

  const refreshConflicts = useCallback(async () => {
    if (!selectedDecisionId) return
    const c = await onGetConflicts(selectedDecisionId)
    setConflicts(c)
  }, [selectedDecisionId, onGetConflicts])

  if (!activeChat) {
    return (
      <div className="text-sm text-muted-foreground px-4 py-6">
        Open a chat to manage decisions.
      </div>
    )
  }

  const filteredDecisions =
    filterStage === 'all'
      ? decisions
      : decisions.filter((d) => getStage(d) === filterStage)

  const counts = {
    all: decisions.length,
    proposed: decisions.filter((d) => getStage(d) === 'proposed').length,
    active: decisions.filter((d) => getStage(d) === 'active').length,
    resolved: decisions.filter((d) => getStage(d) === 'resolved').length,
  }

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Decision Center</h3>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onRefresh}>
              Refresh
            </Button>
            <CreateDecisionDialog onSubmit={onCreateDecision} />
          </div>
        </div>

        {/* Stage filter tabs */}
        <div className="flex gap-1">
          {(
            [
              ['all', 'All'],
              ['proposed', 'Proposed'],
              ['active', 'Active'],
              ['resolved', 'Resolved'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilterStage(key)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                filterStage === key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {label} ({counts[key]})
            </button>
          ))}
        </div>
      </div>

      {/* Decision list */}
      <ScrollArea className="flex-1 p-4">
        {isLoading && (
          <div className="text-sm text-muted-foreground mb-3">
            Loading decisions...
          </div>
        )}

        <div className="space-y-3">
          {filteredDecisions.map((decision) => (
            <div key={decision.id}>
              <DecisionCard
                decision={decision}
                currentUserId={safeUserId}
                onVote={(optionId) =>
                  onVoteOnOption(decision, optionId, safeUserId)
                }
                onChangeStage={(stage, resolvedOptionId) =>
                  onChangeStage(decision, stage, resolvedOptionId)
                }
                onLock={() => onLockDecision(decision.id)}
                onUnlock={() => onUnlockDecision(decision.id)}
                onViewDetails={() => handleViewDetails(decision.id)}
              />
              {selectedDecisionId === decision.id && (
                <DetailsPanel
                  decision={decision}
                  history={history}
                  conflicts={conflicts}
                  resolutionText={resolutionText}
                  onResolutionTextChange={setResolutionText}
                  onResolveConflict={async (conflictId) => {
                    await onResolveConflict(
                      decision.id,
                      conflictId,
                      resolutionText
                    )
                  }}
                  onRefreshConflicts={refreshConflicts}
                />
              )}
            </div>
          ))}

          {!isLoading && filteredDecisions.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-8">
              {filterStage === 'all'
                ? 'No decisions yet. Create one to get started.'
                : `No ${filterStage} decisions.`}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
