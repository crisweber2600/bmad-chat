import { Chat } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { ChatsTeardrop, Plus } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface ChatListProps {
  chats: Chat[]
  activeChat: string | null
  onSelectChat: (chatId: string) => void
  onNewChat: () => void
}

export function ChatList({ chats, activeChat, onSelectChat, onNewChat }: ChatListProps) {
  return (
    <div className="h-full flex flex-col bg-sidebar border-r border-sidebar-border">
      <div className="p-4">
        <Button onClick={onNewChat} className="w-full" size="sm">
          <Plus size={18} weight="bold" className="mr-2" />
          New Chat
        </Button>
      </div>

      <Separator />

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {chats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No chats yet
            </div>
          ) : (
            chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className={cn(
                  'w-full text-left p-3 rounded-lg transition-colors',
                  'hover:bg-sidebar-accent',
                  activeChat === chat.id
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground'
                )}
              >
                <div className="flex items-start gap-2">
                  <ChatsTeardrop
                    size={18}
                    weight="duotone"
                    className="shrink-0 mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{chat.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {new Date(chat.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {chat.messages.length}
                  </Badge>
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
