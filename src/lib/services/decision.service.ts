import { apiRequest } from '@/lib/api'
import {
  DecisionConflict,
  DecisionOption,
  DecisionRecord,
  DecisionStage,
  DecisionType,
  DecisionValue,
  DecisionVersion,
} from '@/lib/types'

// ---------------------------------------------------------------------------
// API payload types (match backend DTOs)
// ---------------------------------------------------------------------------

export interface DecisionListPayload {
  decisions: DecisionRecord[]
}

export interface DecisionHistoryPayload {
  versions: DecisionVersion[]
}

export interface DecisionConflictPayload {
  conflicts: DecisionConflict[]
}

// ---------------------------------------------------------------------------
// DecisionService — thin API layer over /v1/decisions endpoints
// ---------------------------------------------------------------------------

export class DecisionService {
  /** GET /v1/decisions?chatId=...&limit=...&offset=... */
  static async listDecisions(
    chatId: string,
    options?: { limit?: number; offset?: number; signal?: AbortSignal }
  ): Promise<DecisionListPayload> {
    const params = new URLSearchParams({ chatId })
    if (options?.limit != null) params.set('limit', String(options.limit))
    if (options?.offset != null) params.set('offset', String(options.offset))
    return apiRequest<DecisionListPayload>(
      `/v1/decisions?${params.toString()}`,
      { signal: options?.signal }
    )
  }

  /** GET /v1/decisions/:id */
  static async getDecision(decisionId: string): Promise<DecisionRecord> {
    return apiRequest<DecisionRecord>(`/v1/decisions/${decisionId}`)
  }

  /** POST /v1/decisions — create a structured question+options decision */
  static async createDecision(
    chatId: string,
    question: string,
    options: string[],
    decisionType: DecisionType = 'poll',
    context?: string
  ): Promise<DecisionRecord> {
    const value: DecisionValue = {
      question,
      options: options.map((label, index) => ({
        id: `opt-${index + 1}`,
        label,
        votes: 0,
        voters: [],
      })),
      decisionType,
      context,
      stage: 'proposed',
      resolvedOptionId: null,
    }

    return apiRequest<DecisionRecord>('/v1/decisions', {
      method: 'POST',
      body: {
        chatId,
        title: question,
        value,
        reason: 'ui-create',
      },
    })
  }

  /** PATCH /v1/decisions/:id — generic value update with optimistic concurrency */
  static async updateDecision(
    decisionId: string,
    value: Record<string, any>,
    reason = 'ui-update',
    expectedVersion?: number
  ): Promise<DecisionRecord> {
    return apiRequest<DecisionRecord>(`/v1/decisions/${decisionId}`, {
      method: 'PATCH',
      body: { value, reason, ...(expectedVersion != null && { expectedVersion }) },
    })
  }

  /** Vote on a specific option within a decision (with optimistic concurrency + retry on 409) */
  static async voteOnOption(
    decision: DecisionRecord,
    optionId: string,
    userId: string
  ): Promise<DecisionRecord> {
    const buildVoteValue = (d: DecisionRecord): DecisionValue => {
      const currentValue = d.value as DecisionValue
      const updatedOptions = (currentValue.options || []).map(
        (opt: DecisionOption) => {
          if (opt.id !== optionId) return opt
          const alreadyVoted = opt.voters.includes(userId)
          return {
            ...opt,
            votes: alreadyVoted ? opt.votes - 1 : opt.votes + 1,
            voters: alreadyVoted
              ? opt.voters.filter((v) => v !== userId)
              : [...opt.voters, userId],
          }
        }
      )
      return { ...currentValue, options: updatedOptions }
    }

    try {
      return await DecisionService.updateDecision(
        decision.id,
        buildVoteValue(decision),
        'vote',
        decision.version
      )
    } catch (error: any) {
      if (error?.statusCode === 409) {
        // Refetch and retry once on version conflict
        const fresh = await DecisionService.getDecision(decision.id)
        return DecisionService.updateDecision(
          fresh.id,
          buildVoteValue(fresh),
          'vote',
          fresh.version
        )
      }
      throw error
    }
  }

  /** Change the stage of a decision (proposed → active → resolved) with optimistic concurrency */
  static async changeStage(
    decision: DecisionRecord,
    newStage: DecisionStage,
    resolvedOptionId?: string
  ): Promise<DecisionRecord> {
    const buildStageValue = (d: DecisionRecord): DecisionValue => {
      const currentValue = d.value as DecisionValue
      return {
        ...currentValue,
        stage: newStage,
        resolvedOptionId:
          newStage === 'resolved'
            ? resolvedOptionId ?? currentValue.resolvedOptionId
            : currentValue.resolvedOptionId,
      }
    }

    try {
      return await DecisionService.updateDecision(
        decision.id,
        buildStageValue(decision),
        `stage-change-${newStage}`,
        decision.version
      )
    } catch (error: any) {
      if (error?.statusCode === 409) {
        const fresh = await DecisionService.getDecision(decision.id)
        return DecisionService.updateDecision(
          fresh.id,
          buildStageValue(fresh),
          `stage-change-${newStage}`,
          fresh.version
        )
      }
      throw error
    }
  }

  /** POST /v1/decisions/:id/lock */
  static async lockDecision(
    decisionId: string,
    reason = 'manual-lock'
  ): Promise<DecisionRecord> {
    return apiRequest<DecisionRecord>(`/v1/decisions/${decisionId}/lock`, {
      method: 'POST',
      body: { reason },
    })
  }

  /** POST /v1/decisions/:id/unlock */
  static async unlockDecision(decisionId: string): Promise<DecisionRecord> {
    return apiRequest<DecisionRecord>(`/v1/decisions/${decisionId}/unlock`, {
      method: 'POST',
      body: {},
    })
  }

  /** GET /v1/decisions/:id/history */
  static async getHistory(decisionId: string): Promise<DecisionVersion[]> {
    const payload = await apiRequest<DecisionHistoryPayload>(
      `/v1/decisions/${decisionId}/history`
    )
    return payload.versions || []
  }

  /** GET /v1/decisions/:id/conflicts */
  static async getConflicts(decisionId: string): Promise<DecisionConflict[]> {
    const payload = await apiRequest<DecisionConflictPayload>(
      `/v1/decisions/${decisionId}/conflicts`
    )
    return payload.conflicts || []
  }

  /** POST /v1/decisions/:id/conflicts/:conflictId/resolve */
  static async resolveConflict(
    decisionId: string,
    conflictId: string,
    resolution: string
  ): Promise<DecisionConflict> {
    return apiRequest<DecisionConflict>(
      `/v1/decisions/${decisionId}/conflicts/${conflictId}/resolve`,
      {
        method: 'POST',
        body: { resolution },
      }
    )
  }
}
