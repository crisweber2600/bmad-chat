import { useEffect, useState } from 'react'
import { PullRequest, User, FileChange } from '@/lib/types'
import { apiRequest } from '@/lib/api'
import { toast } from 'sonner'

interface PullRequestListPayload {
  pullRequests: PullRequest[]
  total: number
  limit: number
  offset: number
}

export function usePullRequests() {
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([])

  useEffect(() => {
    const loadPullRequests = async () => {
      try {
        const payload = await apiRequest<PullRequestListPayload>('/v1/pull-requests')
        setPullRequests(payload.pullRequests || [])
      } catch (error) {
        console.error('Failed to load pull requests:', error)
      }
    }

    loadPullRequests()
  }, [])

  const createPR = async (
    title: string,
    description: string,
    chatId: string,
    _currentUser: User,
    pendingChanges: FileChange[],
    onBroadcast?: (type: string, metadata: any) => Promise<void> | void
  ) => {
    const newPR = await apiRequest<PullRequest>('/v1/pull-requests', {
      method: 'POST',
      body: {
        title,
        description,
        chatId,
        fileChanges: pendingChanges,
      },
    })

    setPullRequests((current) => [newPR, ...current])
    if (onBroadcast) {
      await onBroadcast('pr_created', { prId: newPR.id, title })
    }

    toast.success('Pull request created')
    return newPR
  }

  const mergePR = async (
    prId: string,
    onBroadcast?: (type: string, metadata: any) => Promise<void> | void
  ) => {
    const updated = await apiRequest<PullRequest>(`/v1/pull-requests/${prId}/merge`, {
      method: 'POST',
      body: {},
    })

    setPullRequests((current) => current.map((pr) => (pr.id === prId ? updated : pr)))
    if (onBroadcast) {
      await onBroadcast('pr_updated', { prId, status: 'merged' })
    }

    toast.success('Pull request merged successfully')
  }

  const closePR = async (prId: string) => {
    const updated = await apiRequest<PullRequest>(`/v1/pull-requests/${prId}/close`, {
      method: 'POST',
      body: {},
    })

    setPullRequests((current) => current.map((pr) => (pr.id === prId ? updated : pr)))
    toast.info('Pull request closed')
  }

  const approvePR = async (prId: string) => {
    const updated = await apiRequest<PullRequest>(`/v1/pull-requests/${prId}/approve`, {
      method: 'POST',
      body: {},
    })

    setPullRequests((current) => current.map((pr) => (pr.id === prId ? updated : pr)))
    toast.success('Pull request approved')
  }

  const commentOnPR = async (prId: string, content: string) => {
    const updated = await apiRequest<PullRequest>(`/v1/pull-requests/${prId}/comments`, {
      method: 'POST',
      body: { content },
    })

    setPullRequests((current) => current.map((pr) => (pr.id === prId ? updated : pr)))
  }

  const addLineComment = async (
    prId: string,
    fileId: string,
    lineNumber: number,
    lineType: 'addition' | 'deletion' | 'unchanged',
    content: string,
    _currentUser: User,
    parentId?: string,
    onBroadcast?: (type: string, metadata: any) => Promise<void> | void
  ) => {
    await apiRequest(`/v1/pull-requests/${prId}/files/${encodeURIComponent(fileId)}/comments`, {
      method: 'POST',
      body: {
        lineNumber,
        lineType,
        content,
        parentId,
      },
    })

    const refreshed = await apiRequest<PullRequest>(`/v1/pull-requests/${prId}`)
    setPullRequests((current) => current.map((pr) => (pr.id === prId ? refreshed : pr)))
    toast.success('Comment added')

    if (onBroadcast) {
      await onBroadcast('pr_updated', { prId, action: 'comment_added' })
    }
  }

  const resolveLineComment = async (prId: string, commentId: string) => {
    await apiRequest(`/v1/pull-requests/${prId}/line-comments/${commentId}/resolve`, {
      method: 'POST',
      body: {},
    })

    const refreshed = await apiRequest<PullRequest>(`/v1/pull-requests/${prId}`)
    setPullRequests((current) => current.map((pr) => (pr.id === prId ? refreshed : pr)))
    toast.success('Comment resolved')
  }

  const toggleLineCommentReaction = async (
    prId: string,
    commentId: string,
    emoji: string
  ) => {
    await apiRequest(`/v1/pull-requests/${prId}/line-comments/${commentId}/reactions/toggle`, {
      method: 'POST',
      body: { emoji },
    })

    const refreshed = await apiRequest<PullRequest>(`/v1/pull-requests/${prId}`)
    setPullRequests((current) => current.map((pr) => (pr.id === prId ? refreshed : pr)))
  }

  const getOpenPRs = () => pullRequests.filter((pr) => pr.status === 'open' || pr.status === 'approved')
  const getMergedPRs = () => pullRequests.filter((pr) => pr.status === 'merged')
  const getClosedPRs = () => pullRequests.filter((pr) => pr.status === 'closed')

  return {
    pullRequests,
    createPR,
    mergePR,
    closePR,
    approvePR,
    commentOnPR,
    addLineComment,
    resolveLineComment,
    toggleLineCommentReaction,
    getOpenPRs,
    getMergedPRs,
    getClosedPRs,
  }
}
