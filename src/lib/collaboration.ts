import * as signalR from '@microsoft/signalr'
import { apiRequest, getAccessToken, getApiBaseUrl } from '@/lib/api'
import { UserPresence, CollaborationEvent } from '@/lib/types'

type ConnectionStatus = 'connected' | 'connecting' | 'reconnecting' | 'disconnected'

interface PresenceListPayload {
  users: UserPresence[]
}

interface CollaborationEventListPayload {
  events: CollaborationEvent[]
}

export class CollaborationService {
  private currentUserId: string | null = null
  private activeChatId: string | null = null
  private eventListeners: Map<string, Set<(event: CollaborationEvent) => void>> = new Map()
  private connection: signalR.HubConnection | null = null
  private connectionStatusHandler: ((status: ConnectionStatus) => void) | null = null

  async initialize(userId: string) {
    this.currentUserId = userId
    await this.ensureConnection()
    await this.updatePresence()
  }

  setConnectionStatusHandler(handler: ((status: ConnectionStatus) => void) | null) {
    this.connectionStatusHandler = handler
  }

  async cleanup() {
    if (this.currentUserId) {
      await this.updatePresence({
        isTyping: false,
        typingChatId: null,
      })
    }

    if (this.connection) {
      await this.connection.stop()
      this.connection = null
    }

    this.connectionStatusHandler?.('disconnected')
  }

  async updatePresence(updates?: Partial<UserPresence>) {
    if (!this.currentUserId) return

    await apiRequest<UserPresence>(`/v1/users/${this.currentUserId}/presence`, {
      method: 'PUT',
      body: {
        activeChat: updates?.activeChat ?? this.activeChatId,
        isTyping: updates?.isTyping ?? false,
        typingChatId: updates?.typingChatId ?? null,
        cursorPosition: updates?.cursorPosition ?? null,
      },
    })
  }

  async getActiveUsers(chatId?: string): Promise<UserPresence[]> {
    const path = chatId ? `/v1/presence?chatId=${encodeURIComponent(chatId)}` : '/v1/presence'
    const payload = await apiRequest<PresenceListPayload>(path)
    return payload.users || []
  }

  async setTyping(chatId: string, isTyping: boolean) {
    await this.updatePresence({
      isTyping,
      typingChatId: isTyping ? chatId : null,
      activeChat: chatId,
    })

    await this.broadcastEvent({
      id: `event-${Date.now()}`,
      type: isTyping ? 'typing_start' : 'typing_stop',
      userId: this.currentUserId!,
      userName: '',
      chatId,
      timestamp: Date.now(),
    })
  }

  async setActiveChat(chatId: string | null) {
    this.activeChatId = chatId
    await this.updatePresence({ activeChat: chatId })
  }

  async broadcastEvent(event: CollaborationEvent) {
    await apiRequest<CollaborationEvent>('/v1/collaboration-events', {
      method: 'POST',
      body: {
        type: event.type,
        chatId: event.chatId,
        prId: event.prId,
        metadata: event.metadata || {},
      },
    })
  }

  async getRecentEvents(since: number): Promise<CollaborationEvent[]> {
    const payload = await apiRequest<CollaborationEventListPayload>(`/v1/collaboration-events?since=${since}`)
    return payload.events || []
  }

  subscribe(eventType: string, callback: (event: CollaborationEvent) => void) {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set())
    }

    this.eventListeners.get(eventType)!.add(callback)
    return () => {
      this.eventListeners.get(eventType)?.delete(callback)
    }
  }

  notifyListeners(event: CollaborationEvent) {
    const directListeners = this.eventListeners.get(event.type)
    if (directListeners) {
      directListeners.forEach((listener) => listener(event))
    }

    const wildcard = this.eventListeners.get('*')
    if (wildcard) {
      wildcard.forEach((listener) => listener(event))
    }
  }

  private async ensureConnection() {
    if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
      return
    }

    this.connectionStatusHandler?.('connecting')

    const token = getAccessToken()
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(`${getApiBaseUrl()}/hubs/chat`, {
        accessTokenFactory: () => token || '',
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .build()

    this.connection.on('SparkCompatEvent', (event: CollaborationEvent) => {
      this.notifyListeners(event)
    })

    this.connection.on('SESSION_RESTORED', () => {
      const synthetic: CollaborationEvent = {
        id: `event-${Date.now()}`,
        type: 'user_join',
        userId: this.currentUserId || '',
        userName: 'System',
        chatId: this.activeChatId || undefined,
        timestamp: Date.now(),
        metadata: { sessionRestored: true },
      }
      this.notifyListeners(synthetic)
    })

    this.connection.onreconnecting(() => {
      this.connectionStatusHandler?.('reconnecting')
    })

    this.connection.onreconnected(() => {
      this.connectionStatusHandler?.('connected')
    })

    this.connection.onclose(() => {
      this.connectionStatusHandler?.('disconnected')
    })

    try {
      await this.connection.start()
      this.connectionStatusHandler?.('connected')
    } catch {
      this.connectionStatusHandler?.('disconnected')
    }
  }
}

export const collaborationService = new CollaborationService()
