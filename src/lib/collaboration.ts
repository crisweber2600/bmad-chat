import { UserPresence, CollaborationEvent } from './types'

const PRESENCE_KEY = 'user-presence'
const EVENTS_KEY = 'collaboration-events'
const PRESENCE_TIMEOUT = 30000

export class CollaborationService {
  private currentUserId: string | null = null
  private presenceInterval: number | null = null
  private eventListeners: Map<string, Set<(event: CollaborationEvent) => void>> = new Map()

  async initialize(userId: string) {
    this.currentUserId = userId
    await this.updatePresence()
    
    this.presenceInterval = window.setInterval(() => {
      this.updatePresence()
    }, 5000)

    await this.cleanupStalePresence()
  }

  async cleanup() {
    if (this.presenceInterval) {
      clearInterval(this.presenceInterval)
      this.presenceInterval = null
    }

    if (this.currentUserId) {
      await this.removePresence(this.currentUserId)
    }
  }

  async updatePresence(updates?: Partial<UserPresence>) {
    if (!this.currentUserId) return

    const allPresence = await this.getAllPresence()
    const currentPresence = allPresence[this.currentUserId] || {}

    const updatedPresence: UserPresence = {
      ...currentPresence,
      userId: this.currentUserId,
      lastSeen: Date.now(),
      ...updates,
    } as UserPresence

    allPresence[this.currentUserId] = updatedPresence
    await window.spark.kv.set(PRESENCE_KEY, allPresence)
  }

  async getAllPresence(): Promise<Record<string, UserPresence>> {
    const presence = await window.spark.kv.get<Record<string, UserPresence>>(PRESENCE_KEY)
    return presence || {}
  }

  async getActiveUsers(chatId?: string): Promise<UserPresence[]> {
    const allPresence = await this.getAllPresence()
    const now = Date.now()
    
    return Object.values(allPresence).filter((presence) => {
      const isActive = now - presence.lastSeen < PRESENCE_TIMEOUT
      const inChat = !chatId || presence.activeChat === chatId
      return isActive && inChat
    })
  }

  async setTyping(chatId: string, isTyping: boolean) {
    await this.updatePresence({
      isTyping,
      typingChatId: isTyping ? chatId : null,
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
    await this.updatePresence({ activeChat: chatId })
  }

  async removePresence(userId: string) {
    const allPresence = await this.getAllPresence()
    delete allPresence[userId]
    await window.spark.kv.set(PRESENCE_KEY, allPresence)
  }

  async cleanupStalePresence() {
    const allPresence = await this.getAllPresence()
    const now = Date.now()
    let hasChanges = false

    for (const [userId, presence] of Object.entries(allPresence)) {
      if (now - presence.lastSeen > PRESENCE_TIMEOUT) {
        delete allPresence[userId]
        hasChanges = true
      }
    }

    if (hasChanges) {
      await window.spark.kv.set(PRESENCE_KEY, allPresence)
    }
  }

  async broadcastEvent(event: CollaborationEvent) {
    const events = await window.spark.kv.get<CollaborationEvent[]>(EVENTS_KEY) || []
    events.push(event)
    
    if (events.length > 100) {
      events.shift()
    }
    
    await window.spark.kv.set(EVENTS_KEY, events)
  }

  async getRecentEvents(since: number): Promise<CollaborationEvent[]> {
    const events = await window.spark.kv.get<CollaborationEvent[]>(EVENTS_KEY) || []
    return events.filter(event => event.timestamp > since)
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
    const listeners = this.eventListeners.get(event.type)
    if (listeners) {
      listeners.forEach(callback => callback(event))
    }
  }
}

export const collaborationService = new CollaborationService()
