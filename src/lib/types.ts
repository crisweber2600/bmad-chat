export type UserRole = 'technical' | 'business'

export interface User {
  id: string
  name: string
  avatarUrl: string
  role: UserRole
  email: string
}

export interface Message {
  id: string
  chatId: string
  content: string
  role: 'user' | 'assistant'
  timestamp: number
  userId?: string
  fileChanges?: FileChange[]
}

export interface FileChange {
  path: string
  additions: string[]
  deletions: string[]
  status: 'pending' | 'staged' | 'committed'
}

export interface Chat {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  messages: Message[]
  participants: string[]
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
