import { apiRequest } from '@/lib/api'
import { LineComment, User, EmojiReaction, FileChange } from '@/lib/types'

// ---------------------------------------------------------------------------
// API payload types (match backend DTOs)
// ---------------------------------------------------------------------------

export interface LineCommentListPayload {
  pullRequestId: string
  fileId: string
  comments: LineComment[]
  total: number
}

// ---------------------------------------------------------------------------
// LineCommentService — API layer + local utilities for pending changes
// ---------------------------------------------------------------------------

export class LineCommentService {
  // =========================================================================
  // API methods — call backend /v1/pull-requests/:prId/... endpoints
  // =========================================================================

  /** GET /v1/pull-requests/:prId/files/:fileId/comments */
  static async listComments(
    prId: string,
    fileId: string
  ): Promise<LineCommentListPayload> {
    return apiRequest<LineCommentListPayload>(
      `/v1/pull-requests/${prId}/files/${encodeURIComponent(fileId)}/comments`
    )
  }

  /** POST /v1/pull-requests/:prId/files/:fileId/comments */
  static async createComment(
    prId: string,
    fileId: string,
    data: {
      lineNumber: number
      lineType: 'addition' | 'deletion' | 'unchanged'
      content: string
      parentId?: string
    }
  ): Promise<LineComment> {
    return apiRequest<LineComment>(
      `/v1/pull-requests/${prId}/files/${encodeURIComponent(fileId)}/comments`,
      { method: 'POST', body: data }
    )
  }

  /** PATCH /v1/pull-requests/:prId/comments/:commentId */
  static async editComment(
    prId: string,
    commentId: string,
    content: string
  ): Promise<LineComment> {
    return apiRequest<LineComment>(
      `/v1/pull-requests/${prId}/comments/${commentId}`,
      { method: 'PATCH', body: { content } }
    )
  }

  /** DELETE /v1/pull-requests/:prId/comments/:commentId */
  static async deleteComment(
    prId: string,
    commentId: string
  ): Promise<LineComment> {
    return apiRequest<LineComment>(
      `/v1/pull-requests/${prId}/comments/${commentId}`,
      { method: 'DELETE' }
    )
  }

  /** POST /v1/pull-requests/:prId/line-comments/:commentId/resolve */
  static async resolveComment(
    prId: string,
    commentId: string
  ): Promise<LineComment> {
    return apiRequest<LineComment>(
      `/v1/pull-requests/${prId}/line-comments/${commentId}/resolve`,
      { method: 'POST', body: {} }
    )
  }

  /** POST /v1/pull-requests/:prId/comments/:commentId/reactions */
  static async toggleReaction(
    prId: string,
    commentId: string,
    emoji: string
  ): Promise<LineComment> {
    return apiRequest<LineComment>(
      `/v1/pull-requests/${prId}/comments/${commentId}/reactions`,
      { method: 'POST', body: { emoji } }
    )
  }

  // =========================================================================
  // Local utilities — for pre-PR pending changes (no API calls)
  // =========================================================================

  static createLocalComment(
    fileId: string,
    lineNumber: number,
    lineType: 'addition' | 'deletion' | 'unchanged',
    content: string,
    currentUser: User
  ): LineComment {
    return {
      id: `line-comment-${Date.now()}`,
      fileId,
      lineNumber,
      lineType,
      author: currentUser.name,
      authorAvatar: currentUser.avatarUrl,
      content,
      timestamp: Date.now(),
      resolved: false,
    }
  }

  static addReplyToComment(
    comment: LineComment,
    reply: LineComment
  ): LineComment {
    return {
      ...comment,
      replies: [...(comment.replies || []), reply],
    }
  }

  static addCommentToFile(
    file: FileChange,
    comment: LineComment,
    parentId?: string
  ): FileChange {
    if (parentId) {
      return {
        ...file,
        lineComments: (file.lineComments || []).map((existingComment) => {
          if (existingComment.id === parentId) {
            return this.addReplyToComment(existingComment, comment)
          }
          return existingComment
        }),
      }
    }

    return {
      ...file,
      lineComments: [...(file.lineComments || []), comment],
    }
  }

  static resolveCommentInFile(file: FileChange, commentId: string): FileChange {
    return {
      ...file,
      lineComments: (file.lineComments || []).map((comment) =>
        comment.id === commentId ? { ...comment, resolved: true } : comment
      ),
    }
  }

  static toggleReactionInFile(
    file: FileChange,
    commentId: string,
    emoji: string,
    user: User
  ): FileChange {
    const updateComment = (comment: LineComment): LineComment => {
      if (comment.id === commentId) {
        return this.toggleReactionLocal(comment, emoji, user)
      }
      if (comment.replies) {
        return {
          ...comment,
          replies: comment.replies.map(updateComment),
        }
      }
      return comment
    }

    return {
      ...file,
      lineComments: (file.lineComments || []).map(updateComment),
    }
  }

  private static toggleReactionLocal(
    comment: LineComment,
    emoji: string,
    user: User
  ): LineComment {
    const reactions = comment.reactions || []
    const existingReaction = reactions.find((r) => r.emoji === emoji)

    if (existingReaction) {
      const hasReacted = existingReaction.userIds.includes(user.id)

      if (hasReacted) {
        const updatedUserIds = existingReaction.userIds.filter((id) => id !== user.id)
        const updatedUserNames = existingReaction.userNames.filter(
          (name) => name !== user.name
        )

        if (updatedUserIds.length === 0) {
          return {
            ...comment,
            reactions: reactions.filter((r) => r.emoji !== emoji),
          }
        }

        return {
          ...comment,
          reactions: reactions.map((r) =>
            r.emoji === emoji
              ? { ...r, userIds: updatedUserIds, userNames: updatedUserNames }
              : r
          ),
        }
      } else {
        return {
          ...comment,
          reactions: reactions.map((r) =>
            r.emoji === emoji
              ? {
                  ...r,
                  userIds: [...r.userIds, user.id],
                  userNames: [...r.userNames, user.name],
                }
              : r
          ),
        }
      }
    } else {
      const newReaction: EmojiReaction = {
        emoji,
        userIds: [user.id],
        userNames: [user.name],
      }

      return {
        ...comment,
        reactions: [...reactions, newReaction],
      }
    }
  }
}
