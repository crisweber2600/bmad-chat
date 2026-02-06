import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { DecisionConflict, DecisionRecord, DecisionVersion } from '@/lib/types'
import { toast } from 'sonner'

interface DecisionCenterPanelProps {
  activeChat: string | null
  decisions: DecisionRecord[]
  isLoading: boolean
  onRefresh: () => Promise<void>
  onCreateDecision: (title: string, value: Record<string, any>) => Promise<void>
  onLockDecision: (decisionId: string) => Promise<void>
  onUnlockDecision: (decisionId: string) => Promise<void>
  onGetHistory: (decisionId: string) => Promise<DecisionVersion[]>
  onGetConflicts: (decisionId: string) => Promise<DecisionConflict[]>
  onResolveConflict: (decisionId: string, conflictId: string, resolution: string) => Promise<void>
}

export function DecisionCenterPanel({
  activeChat,
  decisions,
  isLoading,
  onRefresh,
  onCreateDecision,
  onLockDecision,
  onUnlockDecision,
  onGetHistory,
  onGetConflicts,
  onResolveConflict,
}: DecisionCenterPanelProps) {
  const [title, setTitle] = useState('')
  const [valueText, setValueText] = useState('{\n  "summary": ""\n}')
  const [selectedDecisionId, setSelectedDecisionId] = useState<string | null>(null)
  const [history, setHistory] = useState<DecisionVersion[]>([])
  const [conflicts, setConflicts] = useState<DecisionConflict[]>([])
  const [resolutionText, setResolutionText] = useState('Aligned on latest context')

  const handleCreateDecision = async () => {
    if (!activeChat || !title.trim()) {
      return
    }

    let parsedValue: Record<string, any>
    try {
      parsedValue = JSON.parse(valueText)
    } catch {
      toast.error('Decision value must be valid JSON')
      return
    }

    await onCreateDecision(title.trim(), parsedValue)
    setTitle('')
  }

  const handleSelectDecision = async (decisionId: string) => {
    setSelectedDecisionId(decisionId)
    const [nextHistory, nextConflicts] = await Promise.all([
      onGetHistory(decisionId),
      onGetConflicts(decisionId),
    ])
    setHistory(nextHistory)
    setConflicts(nextConflicts)
  }

  const selectedDecision = decisions.find((decision) => decision.id === selectedDecisionId) || null

  if (!activeChat) {
    return (
      <div className="text-sm text-muted-foreground px-4 py-6">
        Open a chat to manage decision locks, versions, and conflicts.
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Decision Center</h3>
          <Button variant="outline" size="sm" onClick={onRefresh}>
            Refresh
          </Button>
        </div>
        <Input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Decision title"
        />
        <Textarea
          value={valueText}
          onChange={(event) => setValueText(event.target.value)}
          rows={4}
          className="font-mono text-xs"
        />
        <Button className="w-full" onClick={handleCreateDecision}>
          Create Decision
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        {isLoading && <div className="text-sm text-muted-foreground mb-3">Loading decisions...</div>}
        <div className="space-y-3">
          {decisions.map((decision) => (
            <div key={decision.id} className="rounded-md border p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-medium text-sm">{decision.title}</div>
                  <div className="text-xs text-muted-foreground">Version {decision.version}</div>
                </div>
                <div className="flex gap-2">
                  <Badge variant={decision.isLocked ? 'destructive' : 'outline'}>
                    {decision.isLocked ? 'Locked' : 'Open'}
                  </Badge>
                  {decision.openConflictCount > 0 && (
                    <Badge variant="secondary">{decision.openConflictCount} conflict{decision.openConflictCount > 1 ? 's' : ''}</Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {decision.isLocked ? (
                  <Button variant="outline" size="sm" onClick={() => onUnlockDecision(decision.id)}>
                    Unlock
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => onLockDecision(decision.id)}>
                    Lock
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => handleSelectDecision(decision.id)}>
                  View Details
                </Button>
              </div>
            </div>
          ))}
          {!isLoading && decisions.length === 0 && (
            <div className="text-sm text-muted-foreground">No decisions for this chat yet.</div>
          )}
        </div>

        {selectedDecision && (
          <div className="mt-6 border rounded-md p-3 space-y-3">
            <h4 className="font-semibold text-sm">History and Conflicts</h4>
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">History</div>
              <div className="space-y-2">
                {history.map((version) => (
                  <div key={version.id} className="rounded border p-2 text-xs">
                    <div className="font-medium">Version {version.versionNumber}</div>
                    <div className="text-muted-foreground">{version.reason || 'No reason provided'}</div>
                  </div>
                ))}
                {history.length === 0 && <div className="text-xs text-muted-foreground">No version history found.</div>}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Conflicts</div>
              <div className="space-y-2">
                {conflicts.map((conflict) => (
                  <div key={conflict.id} className="rounded border p-2 text-xs space-y-2">
                    <div className="font-medium">{conflict.conflictType}</div>
                    <div className="text-muted-foreground">{conflict.description}</div>
                    <Badge variant={conflict.status === 'resolved' ? 'outline' : 'secondary'}>
                      {conflict.status}
                    </Badge>
                    {conflict.status !== 'resolved' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          await onResolveConflict(selectedDecision.id, conflict.id, resolutionText)
                          const nextConflicts = await onGetConflicts(selectedDecision.id)
                          setConflicts(nextConflicts)
                        }}
                      >
                        Resolve
                      </Button>
                    )}
                  </div>
                ))}
                {conflicts.length === 0 && <div className="text-xs text-muted-foreground">No conflicts found.</div>}
              </div>
              <Textarea
                className="mt-2 text-xs"
                rows={2}
                value={resolutionText}
                onChange={(event) => setResolutionText(event.target.value)}
              />
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
