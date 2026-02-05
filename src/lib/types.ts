export type UserRole = 'technical' | 'business'

export interface User {
  id: string
  name: string
  avatarUrl: string
  role: UserRole
  email: string
  password?: string
}

export interface AuthUser {
  id: string
  email: string
  password: string
  name: string
  role: UserRole
  avatarUrl: string
  createdAt: number
}

export interface UserPresence {
  userId: string
  userName: string
  avatarUrl: string
  activeChat: string | null
  lastSeen: number
  isTyping: boolean
  typingChatId: string | null
  cursorPosition?: {
    chatId: string
    messageId: string
  }
}

export interface Message {
  id: string
  chatId: string
  content: string
  role: 'user' | 'assistant'
  timestamp: number
  userId?: string
  fileChanges?: FileChange[]
  translations?: MessageTranslation[]
}

export interface MessageTranslation {
  role: UserRole
  segments: TranslatedSegment[]
}

export interface TranslatedSegment {
  originalText: string
  startIndex: number
  endIndex: number
  explanation: string
  context: string
  simplifiedText?: string
}

export interface EmojiReaction {
  emoji: string
  userIds: string[]
  userNames: string[]
}

export interface LineComment {
  id: string
  fileId: string
  lineNumber: number
  lineType: 'addition' | 'deletion' | 'unchanged'
  author: string
  authorAvatar: string
  content: string
  timestamp: number
  resolved: boolean
  replies?: LineComment[]
  reactions?: EmojiReaction[]
}

export interface FileChange {
  path: string
  additions: string[]
  deletions: string[]
  status: 'pending' | 'staged' | 'committed'
  lineComments?: LineComment[]
}

export interface Chat {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  messages: Message[]
  participants: string[]
  domain?: string
  service?: string
  feature?: string
}

export type PRStatus = 'open' | 'merged' | 'closed' | 'draft'

export interface PullRequest {
  id: string
  title: string
  description: string
  chatId: string
  author: string
  status: PRStatus
  createdAt: number
  updatedAt: number
  fileChanges: FileChange[]
  comments: PRComment[]
  approvals: string[]
}

export interface PRComment {
  id: string
  prId: string
  author: string
  content: string
  timestamp: number
}

export interface CollaborationEvent {
  id: string
  type: 'user_join' | 'user_leave' | 'typing_start' | 'typing_stop' | 'message_sent' | 'pr_created' | 'pr_updated'
  userId: string
  userName: string
  chatId?: string
  prId?: string
  timestamp: number
  metadata?: Record<string, any>
}
