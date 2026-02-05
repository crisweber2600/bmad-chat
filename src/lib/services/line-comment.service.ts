import { LineComment, User, EmojiReaction, FileChange, PullRequest } from '@/lib/types'

export class LineCommentService {
  static createLineComment(
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

  static resolveComment(comment: LineComment): LineComment {
    return {
      ...comment,
      resolved: true,
    }
  }

  static toggleReaction(
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
        const updatedUserNames = existingReaction.userNames.filter((name) => name !== user.name)
        
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
        comment.id === commentId ? this.resolveComment(comment) : comment
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
        return this.toggleReaction(comment, emoji, user)
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

  static addCommentToPR(
    pr: PullRequest,
    fileId: string,
    comment: LineComment,
    parentId?: string
  ): PullRequest {
    return {
      ...pr,
      fileChanges: pr.fileChanges.map((file) =>
        file.path === fileId
          ? this.addCommentToFile(file, comment, parentId)
          : file
      ),
      updatedAt: Date.now(),
    }
  }

  static resolveCommentInPR(
    pr: PullRequest,
    commentId: string
  ): PullRequest {
    return {
      ...pr,
      fileChanges: pr.fileChanges.map((file) =>
        this.resolveCommentInFile(file, commentId)
      ),
      updatedAt: Date.now(),
    }
  }

  static toggleReactionInPR(
    pr: PullRequest,
    commentId: string,
    emoji: string,
    user: User
  ): PullRequest {
    return {
      ...pr,
      fileChanges: pr.fileChanges.map((file) =>
        this.toggleReactionInFile(file, commentId, emoji, user)
      ),
      updatedAt: Date.now(),
    }
  }
}
