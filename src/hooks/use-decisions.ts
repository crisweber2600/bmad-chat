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
const MAX_CONSECUTIVE_FAILURES = 3

export function useDecisions(chatId?: string | null) {
  const [decisions, setDecisions] = useState<DecisionRecord[]>([])
  const [isLoadingDecisions, setIsLoadingDecisions] = useState(false)

  // Refs to avoid stale closures in intervals/async callbacks
  const chatIdRef = useRef(chatId)
  chatIdRef.current = chatId

  const abortRef = useRef<AbortController | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const consecutiveFailuresRef = useRef(0)
  const initialLoadDoneRef = useRef(false)

  const loadDecisions = useCallback(async (targetChatId?: string) => {
    const id = targetChatId ?? chatIdRef.current
    if (!id) return

    // Abort any in-flight request
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setIsLoadingDecisions(true)
    try {
      const payload = await DecisionService.listDecisions(id, { signal: controller.signal })
      setDecisions(payload.decisions || [])
      consecutiveFailuresRef.current = 0
    } catch (error: any) {
      if (error?.name === 'AbortError') return
      console.error('Failed to load decisions:', error)
      setDecisions([])
    } finally {
      setIsLoadingDecisions(false)
    }
  }, [])

  // Polling: auto-refresh decisions while chatId is set
  useEffect(() => {
    if (!chatId) return

    const controller = new AbortController()
    abortRef.current = controller
    consecutiveFailuresRef.current = 0
    initialLoadDoneRef.current = false

    // Initial load
    const doInitialLoad = async () => {
      setIsLoadingDecisions(true)
      try {
        const payload = await DecisionService.listDecisions(chatId, { signal: controller.signal })
        setDecisions(payload.decisions || [])
        consecutiveFailuresRef.current = 0
      } catch (error: any) {
        if (error?.name === 'AbortError') return
        console.error('Failed to load decisions:', error)
        setDecisions([])
      } finally {
        setIsLoadingDecisions(false)
        initialLoadDoneRef.current = true
      }
    }

    doInitialLoad()

    // Poll (first tick is delayed — no double-fetch)
    pollRef.current = setInterval(async () => {
      const currentId = chatIdRef.current
      if (!currentId || !initialLoadDoneRef.current) return

      try {
        const payload = await DecisionService.listDecisions(currentId, { signal: controller.signal })
        setDecisions(payload.decisions || [])
        consecutiveFailuresRef.current = 0
      } catch (error: any) {
        if (error?.name === 'AbortError') return
        consecutiveFailuresRef.current += 1
        if (consecutiveFailuresRef.current >= MAX_CONSECUTIVE_FAILURES) {
          toast.warning('Decision polling is failing — you may be seeing stale data')
          consecutiveFailuresRef.current = 0 // Reset so we don't spam toasts
        }
      }
    }, POLL_INTERVAL_MS)

    return () => {
      controller.abort()
      if (pollRef.current) clearInterval(pollRef.current)
      pollRef.current = null
      abortRef.current = null
    }
  }, [chatId])

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
