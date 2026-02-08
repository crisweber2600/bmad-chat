import { useEffect, useState, useCallback } from 'react'
import { PullRequest, User, FileChange } from '@/lib/types'
import { PRService } from '@/lib/services/pr.service'
import { LineCommentService } from '@/lib/services/line-comment.service'
import { toast } from 'sonner'

export function usePullRequests() {
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const loadPullRequests = useCallback(async () => {
    setIsLoading(true)
    try {
      const payload = await PRService.listPullRequests()
      setPullRequests(payload.pullRequests || [])
    } catch (error) {
      console.error('Failed to load pull requests:', error)
      toast.error('Failed to load pull requests')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPullRequests()
  }, [loadPullRequests])

  const createPR = async (
    title: string,
    description: string,
    chatId: string,
    _currentUser: User,
    pendingChanges: FileChange[],
    onBroadcast?: (type: string, metadata: any) => Promise<void> | void
  ) => {
    try {
      const newPR = await PRService.createPullRequest({
        title,
        description,
        chatId,
        fileChanges: pendingChanges.map((f) => ({
          path: f.path,
          additions: f.additions,
          deletions: f.deletions,
          status: f.status,
        })),
      })

      setPullRequests((current) => [newPR, ...current])
      if (onBroadcast) {
        await onBroadcast('pr_created', { prId: newPR.id, title })
      }

      toast.success('Pull request created')
      return newPR
    } catch (error) {
      toast.error('Failed to create pull request')
      throw error
    }
  }

  const mergePR = async (
    prId: string,
    onBroadcast?: (type: string, metadata: any) => Promise<void> | void
  ) => {
    try {
      const updated = await PRService.merge(prId)
      setPullRequests((current) => current.map((pr) => (pr.id === prId ? updated : pr)))
      if (onBroadcast) {
        await onBroadcast('pr_updated', { prId, status: 'merged' })
      }

      toast.success('Pull request merged successfully')
    } catch (error) {
      toast.error('Failed to merge pull request')
      throw error
    }
  }

  const closePR = async (prId: string) => {
    try {
      const updated = await PRService.close(prId)
      setPullRequests((current) => current.map((pr) => (pr.id === prId ? updated : pr)))
      toast.info('Pull request closed')
    } catch (error) {
      toast.error('Failed to close pull request')
      throw error
    }
  }

  const approvePR = async (prId: string) => {
    try {
      const updated = await PRService.approve(prId)
      setPullRequests((current) => current.map((pr) => (pr.id === prId ? updated : pr)))
      toast.success('Pull request approved')
    } catch (error) {
      toast.error('Failed to approve pull request')
      throw error
    }
  }

  const commentOnPR = async (prId: string, content: string) => {
    // Optimistic update: add a placeholder comment
    const optimisticComment = {
      id: `optimistic-${Date.now()}`,
      prId,
      author: 'You',
      content,
      timestamp: Date.now(),
    }

    setPullRequests((current) =>
      current.map((pr) =>
        pr.id === prId
          ? { ...pr, comments: [...pr.comments, optimisticComment] }
          : pr
      )
    )

    try {
      const updated = await PRService.addComment(prId, content)
      setPullRequests((current) => current.map((pr) => (pr.id === prId ? updated : pr)))
    } catch (error) {
      // Rollback optimistic update
      setPullRequests((current) =>
        current.map((pr) =>
          pr.id === prId
            ? { ...pr, comments: pr.comments.filter((c) => c.id !== optimisticComment.id) }
            : pr
        )
      )
      toast.error('Failed to add comment')
      throw error
    }
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
    try {
      await LineCommentService.createComment(prId, fileId, {
        lineNumber,
        lineType,
        content,
        parentId,
      })

      // Refresh the PR to get the server-generated comment with proper threading
      const refreshed = await PRService.getPullRequest(prId)
      setPullRequests((current) => current.map((pr) => (pr.id === prId ? refreshed : pr)))
      toast.success('Comment added')

      if (onBroadcast) {
        await onBroadcast('pr_updated', { prId, action: 'comment_added' })
      }
    } catch (error) {
      toast.error('Failed to add line comment')
      throw error
    }
  }

  const resolveLineComment = async (prId: string, commentId: string) => {
    try {
      await LineCommentService.resolveComment(prId, commentId)
      const refreshed = await PRService.getPullRequest(prId)
      setPullRequests((current) => current.map((pr) => (pr.id === prId ? refreshed : pr)))
      toast.success('Comment resolved')
    } catch (error) {
      toast.error('Failed to resolve comment')
      throw error
    }
  }

  const toggleLineCommentReaction = async (
    prId: string,
    commentId: string,
    emoji: string
  ) => {
    // Snapshot current state for rollback on error
    const snapshot = pullRequests.find((pr) => pr.id === prId)

    try {
      await LineCommentService.toggleReaction(prId, commentId, emoji)
      const refreshed = await PRService.getPullRequest(prId)
      setPullRequests((current) => current.map((pr) => (pr.id === prId ? refreshed : pr)))
    } catch (error) {
      // Rollback to snapshot
      if (snapshot) {
        setPullRequests((current) => current.map((pr) => (pr.id === prId ? snapshot : pr)))
      }
      toast.error('Failed to toggle reaction')
    }
  }

  const getOpenPRs = () =>
    pullRequests.filter((pr) => pr.status === 'open' || pr.status === ('approved' as any))
  const getMergedPRs = () => pullRequests.filter((pr) => pr.status === 'merged')
  const getClosedPRs = () => pullRequests.filter((pr) => pr.status === 'closed')

  return {
    pullRequests,
    isLoading,
    refreshPullRequests: loadPullRequests,
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
