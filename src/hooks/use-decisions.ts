import { useCallback, useState } from 'react'
import { apiRequest } from '@/lib/api'
import { DecisionConflict, DecisionRecord, DecisionVersion } from '@/lib/types'
import { toast } from 'sonner'

interface DecisionListPayload {
  decisions: DecisionRecord[]
}

interface DecisionHistoryPayload {
  versions: DecisionVersion[]
}

interface DecisionConflictPayload {
  conflicts: DecisionConflict[]
}

export function useDecisions() {
  const [decisions, setDecisions] = useState<DecisionRecord[]>([])
  const [isLoadingDecisions, setIsLoadingDecisions] = useState(false)

  const loadDecisions = useCallback(async (chatId: string) => {
    setIsLoadingDecisions(true)
    try {
      const payload = await apiRequest<DecisionListPayload>(`/v1/decisions?chatId=${encodeURIComponent(chatId)}`)
      setDecisions(payload.decisions || [])
    } catch (error) {
      console.error('Failed to load decisions:', error)
      setDecisions([])
    } finally {
      setIsLoadingDecisions(false)
    }
  }, [])

  const createDecision = async (chatId: string, title: string, value: Record<string, any>) => {
    const decision = await apiRequest<DecisionRecord>('/v1/decisions', {
      method: 'POST',
      body: { chatId, title, value, reason: 'ui-create' },
    })

    setDecisions((current) => [decision, ...current])
    toast.success('Decision created')
    return decision
  }

  const updateDecision = async (decisionId: string, value: Record<string, any>, reason = 'ui-update') => {
    const decision = await apiRequest<DecisionRecord>(`/v1/decisions/${decisionId}`, {
      method: 'PATCH',
      body: { value, reason },
    })

    setDecisions((current) => current.map((item) => (item.id === decisionId ? decision : item)))
    toast.success('Decision updated')
    return decision
  }

  const lockDecision = async (decisionId: string, reason = 'manual-lock') => {
    const decision = await apiRequest<DecisionRecord>(`/v1/decisions/${decisionId}/lock`, {
      method: 'POST',
      body: { reason },
    })

    setDecisions((current) => current.map((item) => (item.id === decisionId ? decision : item)))
    toast.success('Decision locked')
    return decision
  }

  const unlockDecision = async (decisionId: string) => {
    const decision = await apiRequest<DecisionRecord>(`/v1/decisions/${decisionId}/unlock`, {
      method: 'POST',
      body: {},
    })

    setDecisions((current) => current.map((item) => (item.id === decisionId ? decision : item)))
    toast.success('Decision unlocked')
    return decision
  }

  const getHistory = async (decisionId: string): Promise<DecisionVersion[]> => {
    const payload = await apiRequest<DecisionHistoryPayload>(`/v1/decisions/${decisionId}/history`)
    return payload.versions || []
  }

  const getConflicts = async (decisionId: string): Promise<DecisionConflict[]> => {
    const payload = await apiRequest<DecisionConflictPayload>(`/v1/decisions/${decisionId}/conflicts`)
    return payload.conflicts || []
  }

  const resolveConflict = async (decisionId: string, conflictId: string, resolution: string) => {
    const conflict = await apiRequest<DecisionConflict>(`/v1/decisions/${decisionId}/conflicts/${conflictId}/resolve`, {
      method: 'POST',
      body: { resolution },
    })

    toast.success('Conflict resolved')
    return conflict
  }

  return {
    decisions,
    isLoadingDecisions,
    loadDecisions,
    createDecision,
    updateDecision,
    lockDecision,
    unlockDecision,
    getHistory,
    getConflicts,
    resolveConflict,
  }
}
