import { useState, useEffect, useCallback, useRef } from 'react'
import { UserPresence, CollaborationEvent, User } from '@/lib/types'
import { collaborationService } from '@/lib/collaboration'

export function useCollaboration(currentUser: User | null, activeChat: string | null) {
  const [activeUsers, setActiveUsers] = useState<UserPresence[]>([])
  const [typingUsers, setTypingUsers] = useState<UserPresence[]>([])
  const [recentEvents, setRecentEvents] = useState<CollaborationEvent[]>([])
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'reconnecting' | 'disconnected'>('disconnected')
  const lastEventTimestamp = useRef(Date.now())
  const pollInterval = useRef<number | null>(null)

  useEffect(() => {
    if (!currentUser) return

    const init = async () => {
      collaborationService.setConnectionStatusHandler(setConnectionStatus)
      await collaborationService.initialize(currentUser.id)
      
      await collaborationService.updatePresence({
        userId: currentUser.id,
        userName: currentUser.name,
        avatarUrl: currentUser.avatarUrl,
        activeChat,
        lastSeen: Date.now(),
        isTyping: false,
        typingChatId: null,
      })
    }

    init()

    return () => {
      collaborationService.setConnectionStatusHandler(null)
      collaborationService.cleanup()
    }
  }, [currentUser])

  useEffect(() => {
    if (!currentUser) return

    collaborationService.setActiveChat(activeChat)
  }, [activeChat, currentUser])

  const pollForUpdates = useCallback(async () => {
    if (!currentUser) return

    const users = await collaborationService.getActiveUsers(activeChat || undefined)
    const otherUsers = users.filter(u => u.userId !== currentUser.id)
    setActiveUsers(otherUsers)

    const typing = otherUsers.filter(u => u.isTyping && u.typingChatId === activeChat)
    setTypingUsers(typing)

    const events = await collaborationService.getRecentEvents(lastEventTimestamp.current)
    if (events.length > 0) {
      setRecentEvents(events)
      lastEventTimestamp.current = Math.max(...events.map(e => e.timestamp))
      
      events.forEach(event => {
        collaborationService.notifyListeners(event)
      })
    }
  }, [currentUser, activeChat])

  useEffect(() => {
    if (!currentUser) return

    pollForUpdates()

    pollInterval.current = window.setInterval(pollForUpdates, 2000)

    return () => {
      if (pollInterval.current) {
        clearInterval(pollInterval.current)
      }
    }
  }, [pollForUpdates, currentUser])

  useEffect(() => {
    const unsubscribe = collaborationService.subscribe('*', (event) => {
      setRecentEvents((current) => {
        const next = [...current, event]
        return next.slice(-100)
      })
      lastEventTimestamp.current = Math.max(lastEventTimestamp.current, event.timestamp)
    })

    return () => unsubscribe()
  }, [])

  const setTyping = useCallback(async (isTyping: boolean) => {
    if (!currentUser || !activeChat) return
    await collaborationService.setTyping(activeChat, isTyping)
  }, [currentUser, activeChat])

  const broadcastEvent = useCallback(async (
    type: CollaborationEvent['type'],
    metadata?: Record<string, any>
  ) => {
    if (!currentUser) return

    const event: CollaborationEvent = {
      id: `event-${Date.now()}`,
      type,
      userId: currentUser.id,
      userName: currentUser.name,
      chatId: activeChat || undefined,
      timestamp: Date.now(),
      metadata,
    }

    await collaborationService.broadcastEvent(event)
  }, [currentUser, activeChat])

  const subscribeToEvent = useCallback((
    eventType: string,
    callback: (event: CollaborationEvent) => void
  ) => {
    return collaborationService.subscribe(eventType, callback)
  }, [])

  return {
    activeUsers,
    typingUsers,
    recentEvents,
    connectionStatus,
    setTyping,
    broadcastEvent,
    subscribeToEvent,
  }
}
