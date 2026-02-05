import { useKV } from '@github/spark/hooks'
import { PullRequest, User, FileChange } from '@/lib/types'
import { PRService, LineCommentService } from '@/lib/services'
import { toast } from 'sonner'

export function usePullRequests() {
  const [pullRequests, setPullRequests] = useKV<PullRequest[]>('pull-requests', [])

  const createPR = (
    title: string,
    description: string,
    chatId: string,
    currentUser: User,
    pendingChanges: FileChange[],
    onBroadcast?: (type: string, metadata: any) => void
  ) => {
    const newPR = PRService.createPR(title, description, chatId, currentUser, pendingChanges)
    setPullRequests((current) => [newPR, ...(current || [])])
    
    if (onBroadcast) {
      onBroadcast('pr_created', { prId: newPR.id, title })
    }
    
    toast.success('Pull request created')
    return newPR
  }

  const mergePR = (
    prId: string,
    onBroadcast?: (type: string, metadata: any) => void
  ) => {
    setPullRequests((current) =>
      (current || []).map((pr) =>
        pr.id === prId ? PRService.mergePR(pr) : pr
      )
    )
    
    if (onBroadcast) {
      onBroadcast('pr_updated', { prId, status: 'merged' })
    }
    
    toast.success('Pull request merged successfully')
  }

  const closePR = (prId: string) => {
    setPullRequests((current) =>
      (current || []).map((pr) =>
        pr.id === prId ? PRService.closePR(pr) : pr
      )
    )
    toast.info('Pull request closed')
  }

  const approvePR = (prId: string, userId: string) => {
    setPullRequests((current) =>
      (current || []).map((pr) =>
        pr.id === prId ? PRService.approvePR(pr, userId) : pr
      )
    )
    toast.success('Pull request approved')
  }

  const commentOnPR = (prId: string, content: string, author: string) => {
    setPullRequests((current) =>
      (current || []).map((pr) =>
        pr.id === prId ? PRService.addComment(pr, content, author) : pr
      )
    )
  }

  const addLineComment = (
    prId: string,
    fileId: string,
    lineNumber: number,
    lineType: 'addition' | 'deletion' | 'unchanged',
    content: string,
    currentUser: User,
    parentId?: string,
    onBroadcast?: (type: string, metadata: any) => void
  ) => {
    const comment = LineCommentService.createLineComment(
      fileId,
      lineNumber,
      lineType,
      content,
      currentUser
    )

    setPullRequests((current) =>
      (current || []).map((pr) =>
        pr.id === prId
          ? LineCommentService.addCommentToPR(pr, fileId, comment, parentId)
          : pr
      )
    )

    toast.success('Comment added')
    
    if (onBroadcast) {
      onBroadcast('pr_updated', { prId, action: 'comment_added' })
    }
  }

  const resolveLineComment = (prId: string, commentId: string) => {
    setPullRequests((current) =>
      (current || []).map((pr) =>
        pr.id === prId
          ? LineCommentService.resolveCommentInPR(pr, commentId)
          : pr
      )
    )
    toast.success('Comment resolved')
  }

  const toggleLineCommentReaction = (
    prId: string,
    commentId: string,
    emoji: string,
    currentUser: User
  ) => {
    setPullRequests((current) =>
      (current || []).map((pr) =>
        pr.id === prId
          ? LineCommentService.toggleReactionInPR(pr, commentId, emoji, currentUser)
          : pr
      )
    )
  }

  const getOpenPRs = () => PRService.filterByStatus(pullRequests || [], 'open')
  const getMergedPRs = () => PRService.filterByStatus(pullRequests || [], 'merged')
  const getClosedPRs = () => PRService.filterByStatus(pullRequests || [], 'closed')

  return {
    pullRequests: pullRequests || [],
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
