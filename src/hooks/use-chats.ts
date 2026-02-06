import { useEffect, useState } from 'react'
import { Chat, FileChange, Message, MessageTranslation, User } from '@/lib/types'
import { apiRequest } from '@/lib/api'
import { toast } from 'sonner'

interface ChatListPayload {
  chats: Chat[]
  total: number
  limit: number
  offset: number
}

interface SendMessagePayload {
  userMessage: Message
  aiMessage: Message
  routingAssessment: string
  momentumIndicator: string
}

interface TranslatePayload {
  translation: MessageTranslation
}

export function useChats() {
  const [chats, setChats] = useState<Chat[]>([])

  useEffect(() => {
    const loadChats = async () => {
      try {
        const payload = await apiRequest<ChatListPayload>('/v1/chats')
        setChats(payload.chats || [])
      } catch (error) {
        console.error('Failed to load chats:', error)
      }
    }

    loadChats()
  }, [])

  const createChat = async (
    domain: string,
    service: string,
    feature: string,
    title: string
  ): Promise<Chat> => {
    const newChat = await apiRequest<Chat>('/v1/chats', {
      method: 'POST',
      body: { domain, service, feature, title },
    })

    setChats((current) => [newChat, ...current])
    return newChat
  }

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

  const getChatById = (chatId: string | null): Chat | undefined => {
    if (!chatId) return undefined
    return chats.find((chat) => chat.id === chatId)
  }

  const getOrganization = () => {
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

  return {
    chats,
    createChat,
    addMessage,
    addTranslation,
    getChatById,
    getOrganization,
  }
}

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
    const payload = await apiRequest<SendMessagePayload>(`/v1/chats/${chatId}/messages`, {
      method: 'POST',
      body: {
        content,
        personaOverride: currentUser.role,
      },
    })

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
    const payload = await apiRequest<TranslatePayload>(`/v1/chats/${chatId}/messages/${messageId}/translate`, {
      method: 'POST',
      body: {
        role: currentUser.role,
      },
    })

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
