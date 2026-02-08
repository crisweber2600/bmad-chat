import { useCallback, useEffect, useRef, useState } from 'react'
import { DecisionService } from '@/lib/services/decision.service'
import {
  DecisionConflict,
  DecisionRecord,
  DecisionStage,
  DecisionType,
  DecisionVersion,
} from '@/lib/types'
import { toast } from 'sonner'

const POLL_INTERVAL_MS = 7_000

export function useDecisions(chatId?: string | null) {
  const [decisions, setDecisions] = useState<DecisionRecord[]>([])
  const [isLoadingDecisions, setIsLoadingDecisions] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const loadDecisions = useCallback(async (targetChatId?: string) => {
    const id = targetChatId ?? chatId
    if (!id) return
    setIsLoadingDecisions(true)
    try {
      const payload = await DecisionService.listDecisions(id)
      setDecisions(payload.decisions || [])
    } catch (error) {
      console.error('Failed to load decisions:', error)
      setDecisions([])
    } finally {
      setIsLoadingDecisions(false)
    }
  }, [chatId])

  // Polling: auto-refresh decisions while chatId is set
  useEffect(() => {
    if (!chatId) return
    loadDecisions(chatId)

    pollRef.current = setInterval(() => {
      DecisionService.listDecisions(chatId)
        .then((payload) => setDecisions(payload.decisions || []))
        .catch(() => {/* silent poll failure */})
    }, POLL_INTERVAL_MS)

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [chatId, loadDecisions])

  const createDecision = async (
    targetChatId: string,
    question: string,
    options: string[],
    decisionType: DecisionType = 'poll',
    context?: string
  ) => {
    const decision = await DecisionService.createDecision(
      targetChatId,
      question,
      options,
      decisionType,
      context
    )
    setDecisions((current) => [decision, ...current])
    toast.success('Decision created')
    return decision
  }

  const updateDecision = async (
    decisionId: string,
    value: Record<string, any>,
    reason = 'ui-update'
  ) => {
    const decision = await DecisionService.updateDecision(decisionId, value, reason)
    setDecisions((current) =>
      current.map((item) => (item.id === decisionId ? decision : item))
    )
    toast.success('Decision updated')
    return decision
  }

  const voteOnOption = async (
    decision: DecisionRecord,
    optionId: string,
    userId: string
  ) => {
    const updated = await DecisionService.voteOnOption(decision, optionId, userId)
    setDecisions((current) =>
      current.map((item) => (item.id === decision.id ? updated : item))
    )
    return updated
  }

  const changeStage = async (
    decision: DecisionRecord,
    newStage: DecisionStage,
    resolvedOptionId?: string
  ) => {
    const updated = await DecisionService.changeStage(
      decision,
      newStage,
      resolvedOptionId
    )
    setDecisions((current) =>
      current.map((item) => (item.id === decision.id ? updated : item))
    )
    toast.success(`Decision ${newStage}`)
    return updated
  }

  const lockDecision = async (decisionId: string, reason = 'manual-lock') => {
    const decision = await DecisionService.lockDecision(decisionId, reason)
    setDecisions((current) =>
      current.map((item) => (item.id === decisionId ? decision : item))
    )
    toast.success('Decision locked')
    return decision
  }

  const unlockDecision = async (decisionId: string) => {
    const decision = await DecisionService.unlockDecision(decisionId)
    setDecisions((current) =>
      current.map((item) => (item.id === decisionId ? decision : item))
    )
    toast.success('Decision unlocked')
    return decision
  }

  const getHistory = async (decisionId: string): Promise<DecisionVersion[]> => {
    return DecisionService.getHistory(decisionId)
  }

  const getConflicts = async (
    decisionId: string
  ): Promise<DecisionConflict[]> => {
    return DecisionService.getConflicts(decisionId)
  }

  const resolveConflict = async (
    decisionId: string,
    conflictId: string,
    resolution: string
  ) => {
    const conflict = await DecisionService.resolveConflict(
      decisionId,
      conflictId,
      resolution
    )
    toast.success('Conflict resolved')
    return conflict
  }

  return {
    decisions,
    isLoadingDecisions,
    loadDecisions,
    createDecision,
    updateDecision,
    voteOnOption,
    changeStage,
    lockDecision,
    unlockDecision,
    getHistory,
    getConflicts,
    resolveConflict,
  }
}
