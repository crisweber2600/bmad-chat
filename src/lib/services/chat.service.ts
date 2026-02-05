import { Chat, Message, FileChange } from '@/lib/types'

export class ChatService {
  static createChat(
    title: string,
    domain: string,
    service: string,
    feature: string,
    currentUserId: string
  ): Chat {
    return {
      id: `chat-${Date.now()}`,
      title,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      participants: [currentUserId],
      domain,
      service,
      feature,
    }
  }

  static createMessage(
    chatId: string,
    content: string,
    userId: string,
    role: 'user' | 'assistant',
    fileChanges?: FileChange[]
  ): Message {
    return {
      id: `msg-${Date.now()}`,
      chatId,
      content,
      role,
      timestamp: Date.now(),
      userId: role === 'user' ? userId : undefined,
      fileChanges,
    }
  }

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
