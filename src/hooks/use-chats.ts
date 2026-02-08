import { useCallback, useEffect, useRef, useState } from 'react'
import { Chat, FileChange, Message, MessageTranslation, User } from '@/lib/types'
import { ChatService, SendMessagePayload, TranslatePayload } from '@/lib/services/chat.service'
import { toast } from 'sonner'

export function useChats() {
  const [chats, setChats] = useState<Chat[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const loadedRef = useRef(false)

  // ── Fetch chats on mount ──────────────────────────────────────────────

  const refreshChats = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const payload = await ChatService.listChats()
      setChats(payload.chats || [])
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load chats'
      setError(msg)
      console.error('Failed to load chats:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (loadedRef.current) return
    loadedRef.current = true
    refreshChats()
  }, [refreshChats])

  // ── Create chat (optimistic) ──────────────────────────────────────────

  const createChat = async (
    domain: string,
    service: string,
    feature: string,
    title: string
  ): Promise<Chat> => {
    try {
      const newChat = await ChatService.createChat({ title, domain, service, feature })
      setChats((current) => [newChat, ...current])
      return newChat
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create chat')
      throw err
    }
  }

  // ── Update chat (optimistic + rollback) ───────────────────────────────

  const updateChat = async (
    chatId: string,
    data: { title?: string; domain?: string; service?: string; feature?: string }
  ): Promise<Chat> => {
    const previous = chats

    // Optimistic update
    setChats((current) =>
      current.map((chat) =>
        chat.id === chatId ? { ...chat, ...data, updatedAt: Date.now() } : chat
      )
    )

    try {
      const updated = await ChatService.updateChat(chatId, data)
      // Replace optimistic version with server version
      setChats((current) =>
        current.map((chat) => (chat.id === chatId ? { ...chat, ...updated } : chat))
      )
      return updated
    } catch (err) {
      // Rollback
      setChats(previous)
      toast.error(err instanceof Error ? err.message : 'Failed to update chat')
      throw err
    }
  }

  // ── Delete chat (optimistic + rollback) ───────────────────────────────

  const deleteChat = async (chatId: string): Promise<void> => {
    const previous = chats

    // Optimistic removal
    setChats((current) => current.filter((chat) => chat.id !== chatId))

    try {
      await ChatService.deleteChat(chatId)
      toast.success('Chat deleted')
    } catch (err) {
      // Rollback
      setChats(previous)
      toast.error(err instanceof Error ? err.message : 'Failed to delete chat')
      throw err
    }
  }

  // ── Add message locally (used after API response) ─────────────────────

  const addMessage = (chatId: string, message: Message) => {
    setChats((current) =>
      current.map((chat) => {
        if (chat.id === chatId) {
          const updatedTitle =
            message.role === 'user' && chat.messages.length === 0
              ? message.content.slice(0, 50)
              : chat.title

          return {
            ...chat,
            messages: [...chat.messages, message],
            updatedAt: Date.now(),
            title: updatedTitle,
          }
        }
        return chat
      })
    )
  }

  // ── Add translation locally ───────────────────────────────────────────

  const addTranslation = (
    chatId: string,
    messageId: string,
    translation: MessageTranslation
  ) => {
    setChats((current) =>
      current.map((chat) =>
        chat.id === chatId
          ? {
              ...chat,
              messages: chat.messages.map((msg) =>
                msg.id === messageId
                  ? {
                      ...msg,
                      translations: [...(msg.translations || []), translation],
                    }
                  : msg
              ),
              updatedAt: Date.now(),
            }
          : chat
      )
    )
  }

  // ── Lookups ───────────────────────────────────────────────────────────

  const getChatById = (chatId: string | null): Chat | undefined => {
    if (!chatId) return undefined
    return chats.find((chat) => chat.id === chatId)
  }

  const getOrganization = () => {
    return ChatService.extractOrganization(chats)
  }

  return {
    chats,
    isLoading,
    error,
    createChat,
    updateChat,
    deleteChat,
    refreshChats,
    addMessage,
    addTranslation,
    getChatById,
    getOrganization,
  }
}

// ── Standalone async helpers (used by useChatActions) ─────────────────────

export async function sendMessage(
  content: string,
  chatId: string,
  currentUser: User,
  onMessageCreated: (message: Message) => void,
  onAIResponse: (message: Message, suggestedChanges: FileChange[]) => void,
  onTypingChange: (isTyping: boolean) => void,
  broadcastEvent: (type: string, metadata: any) => void
) {
  await broadcastEvent('message_sent', { content: content.slice(0, 50) })
  onTypingChange(true)

  try {
    const payload = await ChatService.sendMessage(chatId, content, currentUser.role)

    onMessageCreated(payload.userMessage)
    onAIResponse(payload.aiMessage, payload.aiMessage.fileChanges || [])

    if (payload.routingAssessment && payload.routingAssessment !== 'correctly routed') {
      toast.info(`Note: This question might benefit from ${payload.routingAssessment.replace('needs ', '')}`)
    }

    if (payload.aiMessage.fileChanges && payload.aiMessage.fileChanges.length > 0) {
      toast.success('Documentation changes suggested')
    }
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Failed to send message')
    console.error(error)
  } finally {
    onTypingChange(false)
  }
}

export async function translateMessage(
  chatId: string,
  messageId: string,
  currentUser: User,
  onTranslationComplete: (messageId: string, translation: MessageTranslation) => void
) {
  try {
    const payload = await ChatService.translateMessage(chatId, messageId, currentUser.role)

    onTranslationComplete(messageId, payload.translation)

    if (payload.translation.segments && payload.translation.segments.length > 0) {
      toast.success(`Translated ${payload.translation.segments.length} term${payload.translation.segments.length > 1 ? 's' : ''} for ${currentUser.role} context`)
    } else {
      toast.info('No terms needed translation')
    }
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Failed to translate message')
    console.error(error)
  }
}
