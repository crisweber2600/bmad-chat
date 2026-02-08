import { apiRequest } from '@/lib/api'
import { Chat, Message, MessageTranslation, FileChange } from '@/lib/types'

// ---------------------------------------------------------------------------
// API payload types (match backend DTOs)
// ---------------------------------------------------------------------------

export interface ChatListPayload {
  chats: Chat[]
  total: number
  limit: number
  offset: number
}

export interface SendMessagePayload {
  userMessage: Message
  aiMessage: Message
  routingAssessment: string
  momentumIndicator: string
}

export interface TranslatePayload {
  translation: MessageTranslation
}

export interface DeleteChatPayload {
  deleted: boolean
}

// ---------------------------------------------------------------------------
// ChatService — thin API layer over /v1/chats endpoints
// ---------------------------------------------------------------------------

export class ChatService {
  /** GET /v1/chats */
  static async listChats(options?: {
    domain?: string
    service?: string
    feature?: string
    limit?: number
    offset?: number
  }): Promise<ChatListPayload> {
    const params = new URLSearchParams()
    if (options?.domain) params.set('domain', options.domain)
    if (options?.service) params.set('service', options.service)
    if (options?.feature) params.set('feature', options.feature)
    if (options?.limit != null) params.set('limit', String(options.limit))
    if (options?.offset != null) params.set('offset', String(options.offset))

    const qs = params.toString()
    return apiRequest<ChatListPayload>(`/v1/chats${qs ? `?${qs}` : ''}`)
  }

  /** GET /v1/chats/:id */
  static async getChat(chatId: string): Promise<Chat> {
    return apiRequest<Chat>(`/v1/chats/${chatId}`)
  }

  /** POST /v1/chats */
  static async createChat(data: {
    title: string
    domain?: string
    service?: string
    feature?: string
  }): Promise<Chat> {
    return apiRequest<Chat>('/v1/chats', {
      method: 'POST',
      body: data,
    })
  }

  /** PATCH /v1/chats/:id */
  static async updateChat(
    chatId: string,
    data: { title?: string; domain?: string; service?: string; feature?: string }
  ): Promise<Chat> {
    return apiRequest<Chat>(`/v1/chats/${chatId}`, {
      method: 'PATCH',
      body: data,
    })
  }

  /** DELETE /v1/chats/:id (soft-delete) */
  static async deleteChat(chatId: string): Promise<DeleteChatPayload> {
    return apiRequest<DeleteChatPayload>(`/v1/chats/${chatId}`, {
      method: 'DELETE',
    })
  }

  /** POST /v1/chats/:chatId/messages */
  static async sendMessage(
    chatId: string,
    content: string,
    personaOverride?: string
  ): Promise<SendMessagePayload> {
    return apiRequest<SendMessagePayload>(`/v1/chats/${chatId}/messages`, {
      method: 'POST',
      body: { content, personaOverride },
    })
  }

  /** GET /v1/chats/:chatId/messages */
  static async listMessages(
    chatId: string,
    options?: { limit?: number; before?: number; after?: number }
  ): Promise<{ messages: Message[]; hasMore: boolean }> {
    const params = new URLSearchParams()
    if (options?.limit != null) params.set('limit', String(options.limit))
    if (options?.before != null) params.set('before', String(options.before))
    if (options?.after != null) params.set('after', String(options.after))

    const qs = params.toString()
    return apiRequest<{ messages: Message[]; hasMore: boolean }>(
      `/v1/chats/${chatId}/messages${qs ? `?${qs}` : ''}`
    )
  }

  /** POST /v1/chats/:chatId/messages/:messageId/translate */
  static async translateMessage(
    chatId: string,
    messageId: string,
    role: string
  ): Promise<TranslatePayload> {
    return apiRequest<TranslatePayload>(
      `/v1/chats/${chatId}/messages/${messageId}/translate`,
      { method: 'POST', body: { role } }
    )
  }

  // ---------------------------------------------------------------------------
  // Pure utilities (no API calls)
  // ---------------------------------------------------------------------------

  static extractOrganization(chats: Chat[]): {
    domains: string[]
    services: string[]
    features: string[]
  } {
    const domains = new Set<string>()
    const services = new Set<string>()
    const features = new Set<string>()

    chats.forEach((chat) => {
      if (chat.domain) domains.add(chat.domain)
      if (chat.service) services.add(chat.service)
      if (chat.feature) features.add(chat.feature)
    })

    return {
      domains: Array.from(domains),
      services: Array.from(services),
      features: Array.from(features),
    }
  }
}
