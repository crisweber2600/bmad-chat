import { apiRequest } from '@/lib/api'
import { PullRequest, FileChange } from '@/lib/types'

// ---------------------------------------------------------------------------
// API payload types (match backend DTOs)
// ---------------------------------------------------------------------------

export interface PullRequestListPayload {
  pullRequests: PullRequest[]
  total: number
  limit: number
  offset: number
}

export interface FileChangesListPayload {
  pullRequestId: string
  files: FileChange[]
  total: number
}

// ---------------------------------------------------------------------------
// PRService — thin API layer over /v1/pull-requests endpoints
// ---------------------------------------------------------------------------

export class PRService {
  /** GET /v1/pull-requests */
  static async listPullRequests(options?: {
    status?: string
    chatId?: string
    author?: string
    limit?: number
    offset?: number
  }): Promise<PullRequestListPayload> {
    const params = new URLSearchParams()
    if (options?.status) params.set('status', options.status)
    if (options?.chatId) params.set('chatId', options.chatId)
    if (options?.author) params.set('author', options.author)
    if (options?.limit != null) params.set('limit', String(options.limit))
    if (options?.offset != null) params.set('offset', String(options.offset))

    const qs = params.toString()
    return apiRequest<PullRequestListPayload>(`/v1/pull-requests${qs ? `?${qs}` : ''}`)
  }

  /** GET /v1/pull-requests/:id */
  static async getPullRequest(prId: string): Promise<PullRequest> {
    return apiRequest<PullRequest>(`/v1/pull-requests/${prId}`)
  }

  /** POST /v1/pull-requests */
  static async createPullRequest(data: {
    title: string
    description: string
    chatId?: string
    sourceBranch?: string
    targetBranch?: string
    fileChanges: Array<{
      path: string
      additions: string[]
      deletions: string[]
      status?: string
    }>
  }): Promise<PullRequest> {
    return apiRequest<PullRequest>('/v1/pull-requests', {
      method: 'POST',
      body: data,
    })
  }

  /** PATCH /v1/pull-requests/:id */
  static async updatePullRequest(
    prId: string,
    data: { title?: string; description?: string; status?: string }
  ): Promise<PullRequest> {
    return apiRequest<PullRequest>(`/v1/pull-requests/${prId}`, {
      method: 'PATCH',
      body: data,
    })
  }

  /** GET /v1/pull-requests/:id/files */
  static async getFiles(prId: string): Promise<FileChangesListPayload> {
    return apiRequest<FileChangesListPayload>(`/v1/pull-requests/${prId}/files`)
  }

  /** POST /v1/pull-requests/:id/approve */
  static async approve(prId: string): Promise<PullRequest> {
    return apiRequest<PullRequest>(`/v1/pull-requests/${prId}/approve`, {
      method: 'POST',
      body: {},
    })
  }

  /** POST /v1/pull-requests/:id/merge */
  static async merge(prId: string): Promise<PullRequest> {
    return apiRequest<PullRequest>(`/v1/pull-requests/${prId}/merge`, {
      method: 'POST',
      body: {},
    })
  }

  /** POST /v1/pull-requests/:id/close */
  static async close(prId: string): Promise<PullRequest> {
    return apiRequest<PullRequest>(`/v1/pull-requests/${prId}/close`, {
      method: 'POST',
      body: {},
    })
  }

  /** POST /v1/pull-requests/:id/comments (PR-level comment) */
  static async addComment(prId: string, content: string): Promise<PullRequest> {
    return apiRequest<PullRequest>(`/v1/pull-requests/${prId}/comments`, {
      method: 'POST',
      body: { content },
    })
  }

  // ---------------------------------------------------------------------------
  // Pure utilities (no API calls)
  // ---------------------------------------------------------------------------

  static filterByStatus(
    prs: PullRequest[],
    status: PullRequest['status']
  ): PullRequest[] {
    return prs.filter((pr) => pr.status === status)
  }
}
