import { useKV } from '@github/spark/hooks'
import { Chat, Message, User, FileChange, MessageTranslation } from '@/lib/types'
import { ChatService, AIService } from '@/lib/services'
import { toast } from 'sonner'

export function useChats() {
  const [chats, setChats] = useKV<Chat[]>('chats', [])

  const createChat = (
    domain: string,
    service: string,
    feature: string,
    title: string,
    currentUserId: string
  ) => {
    const newChat = ChatService.createChat(title, domain, service, feature, currentUserId)
    setChats((current) => [newChat, ...(current || [])])
    return newChat
  }

  const addMessage = (chatId: string, message: Message) => {
    setChats((current) =>
      (current || []).map((chat) => {
        if (chat.id === chatId) {
          const updatedTitle = message.role === 'user' && chat.messages.length === 0
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
      (current || []).map((chat) =>
        chat.id === chatId
          ? {
              ...chat,
              messages: chat.messages.map((msg) =>
                msg.id === messageId
                  ? {
                      ...msg,
                      translations: [
                        ...(msg.translations || []),
                        translation,
                      ],
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
    return chats?.find((chat) => chat.id === chatId)
  }

  const getOrganization = () => {
    return ChatService.extractOrganization(chats || [])
  }

  return {
    chats: chats || [],
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
  const userMessage = ChatService.createMessage(chatId, content, currentUser.id, 'user')
  onMessageCreated(userMessage)

  await broadcastEvent('message_sent', { content: content.slice(0, 50) })

  onTypingChange(true)

  try {
    const parsed = await AIService.generateChatResponse(content, currentUser)

    if (parsed.routingAssessment && parsed.routingAssessment !== 'correctly routed') {
      toast.info(`Note: This question might benefit from ${parsed.routingAssessment.replace('needs ', '')}`)
    }

    const aiMessage = ChatService.createMessage(
      chatId,
      parsed.response,
      currentUser.id,
      'assistant',
      parsed.suggestedChanges || []
    )

    onAIResponse(aiMessage, parsed.suggestedChanges || [])

    if (parsed.suggestedChanges && parsed.suggestedChanges.length > 0) {
      toast.success('Documentation changes suggested')
    }
  } catch (error) {
    toast.error('Failed to get AI response')
    console.error(error)
  } finally {
    onTypingChange(false)
  }
}

export async function translateMessage(
  messageId: string,
  content: string,
  currentUser: User,
  onTranslationComplete: (messageId: string, translation: MessageTranslation) => void
) {
  try {
    const parsed = await AIService.translateMessage(content, currentUser.role)

    const translation: MessageTranslation = {
      role: currentUser.role,
      segments: parsed.segments || [],
    }

    onTranslationComplete(messageId, translation)

    if (parsed.segments && parsed.segments.length > 0) {
      toast.success(`Translated ${parsed.segments.length} term${parsed.segments.length > 1 ? 's' : ''} for ${currentUser.role} context`)
    } else {
      toast.info('No terms needed translation')
    }
  } catch (error) {
    toast.error('Failed to translate message')
    console.error(error)
  }
}
