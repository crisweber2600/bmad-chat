import { User } from '@/lib/types'
import { sendMessage as sendMessageService, translateMessage as translateMessageService } from './use-chats'

export function useChatActions(
  activeChat: string | null,
  currentUser: User | null,
  addMessage: (chatId: string, message: any) => void,
  addTranslation: (chatId: string, messageId: string, translation: any) => void,
  addPendingChanges: (changes: any[]) => void,
  setIsTyping: (isTyping: boolean) => void,
  setTyping: (isTyping: boolean) => Promise<void>,
  broadcastEvent: (type: string, metadata: any) => Promise<void>,
  deleteChat?: (chatId: string) => Promise<void>,
  updateChat?: (chatId: string, data: { title?: string; domain?: string; service?: string; feature?: string }) => Promise<any>
) {
  const handleSendMessage = async (content: string) => {
    if (!activeChat || !currentUser) return

    await sendMessageService(
      content,
      activeChat,
      currentUser,
      (message) => addMessage(activeChat, message),
      (message, suggestedChanges) => {
        addMessage(activeChat, message)
        if (suggestedChanges.length > 0) {
          addPendingChanges(suggestedChanges)
        }
      },
      setIsTyping,
      broadcastEvent
    )
  }

  const handleTranslateMessage = async (messageId: string) => {
    if (!currentUser || !activeChat) return

    await translateMessageService(
      activeChat,
      messageId,
      currentUser,
      (msgId, translation) => addTranslation(activeChat, msgId, translation)
    )
  }

  const handleTypingChange = async (isTyping: boolean) => {
    await setTyping(isTyping)
  }

  const handleDeleteChat = async (chatId?: string) => {
    const target = chatId || activeChat
    if (!target || !deleteChat) return
    await deleteChat(target)
  }

  const handleUpdateChat = async (
    data: { title?: string; domain?: string; service?: string; feature?: string },
    chatId?: string
  ) => {
    const target = chatId || activeChat
    if (!target || !updateChat) return
    await updateChat(target, data)
  }

  return {
    handleSendMessage,
    handleTranslateMessage,
    handleTypingChange,
    handleDeleteChat,
    handleUpdateChat,
  }
}
