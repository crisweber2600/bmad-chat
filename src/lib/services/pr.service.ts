import { PullRequest, PRComment, FileChange, User } from '@/lib/types'

export class PRService {
  static createPR(
    title: string,
    description: string,
    chatId: string,
    currentUser: User,
    pendingChanges: FileChange[]
  ): PullRequest {
    return {
      id: `pr-${Date.now()}`,
      title,
      description,
      chatId,
      author: currentUser.name,
      status: 'open',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      fileChanges: pendingChanges.map((change) => ({
        ...change,
        status: 'staged' as const,
      })),
      comments: [],
      approvals: [],
    }
  }

  static mergePR(pr: PullRequest): PullRequest {
    return {
      ...pr,
      status: 'merged',
      updatedAt: Date.now(),
    }
  }

  static closePR(pr: PullRequest): PullRequest {
    return {
      ...pr,
      status: 'closed',
      updatedAt: Date.now(),
    }
  }

  static approvePR(pr: PullRequest, userId: string): PullRequest {
    if (pr.approvals.includes(userId)) {
      return pr
    }

    return {
      ...pr,
      approvals: [...pr.approvals, userId],
      updatedAt: Date.now(),
    }
  }

  static addComment(pr: PullRequest, content: string, author: string): PullRequest {
    const comment: PRComment = {
      id: `comment-${Date.now()}`,
      prId: pr.id,
      author,
      content,
      timestamp: Date.now(),
    }

    return {
      ...pr,
      comments: [...pr.comments, comment],
      updatedAt: Date.now(),
    }
  }

  static filterByStatus(prs: PullRequest[], status: PullRequest['status']): PullRequest[] {
    return prs.filter((pr) => pr.status === status)
  }
}
