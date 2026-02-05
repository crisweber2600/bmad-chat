import { useState } from 'react'
import { Chat } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChatsTeardrop, Plus, CaretDown, CaretRight, Folder, FolderOpen } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface ChatListProps {
  chats: Chat[]
  activeChat: string | null
  onSelectChat: (chatId: string) => void
  onNewChat: () => void
}

interface OrganizedChats {
  [domain: string]: {
    [service: string]: {
      [feature: string]: Chat[]
    }
  }
}

export function ChatList({ chats, activeChat, onSelectChat, onNewChat }: ChatListProps) {
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set())
  const [expandedServices, setExpandedServices] = useState<Set<string>>(new Set())
  const [expandedFeatures, setExpandedFeatures] = useState<Set<string>>(new Set())

  const organizedChats: OrganizedChats = chats.reduce((acc, chat) => {
    const domain = chat.domain || 'Uncategorized'
    const service = chat.service || 'General'
    const feature = chat.feature || 'Default'

    if (!acc[domain]) acc[domain] = {}
    if (!acc[domain][service]) acc[domain][service] = {}
    if (!acc[domain][service][feature]) acc[domain][service][feature] = []

    acc[domain][service][feature].push(chat)
    return acc
  }, {} as OrganizedChats)

  const toggleDomain = (domain: string) => {
    setExpandedDomains((prev) => {
      const next = new Set(prev)
      if (next.has(domain)) {
        next.delete(domain)
      } else {
        next.add(domain)
      }
      return next
    })
  }

  const toggleService = (key: string) => {
    setExpandedServices((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const toggleFeature = (key: string) => {
    setExpandedFeatures((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

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
            Object.entries(organizedChats).map(([domain, services]) => {
              const domainCount = Object.values(services).reduce(
                (sum, features) =>
                  sum +
                  Object.values(features).reduce(
                    (featureSum, chats) => featureSum + chats.length,
                    0
                  ),
                0
              )
              const isDomainExpanded = expandedDomains.has(domain)

              return (
                <Collapsible
                  key={domain}
                  open={isDomainExpanded}
                  onOpenChange={() => toggleDomain(domain)}
                >
                  <CollapsibleTrigger className="w-full flex items-center gap-2 p-2 hover:bg-sidebar-accent rounded-md transition-colors group">
                    {isDomainExpanded ? (
                      <CaretDown size={16} weight="bold" className="shrink-0 text-sidebar-foreground" />
                    ) : (
                      <CaretRight size={16} weight="bold" className="shrink-0 text-sidebar-foreground" />
                    )}
                    {isDomainExpanded ? (
                      <FolderOpen size={18} weight="duotone" className="shrink-0 text-primary" />
                    ) : (
                      <Folder size={18} weight="duotone" className="shrink-0 text-muted-foreground" />
                    )}
                    <span className="flex-1 text-left font-semibold text-sm text-sidebar-foreground">
                      {domain}
                    </span>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {domainCount}
                    </Badge>
                  </CollapsibleTrigger>

                  <CollapsibleContent className="pl-4">
                    {Object.entries(services).map(([service, features]) => {
                      const serviceKey = `${domain}-${service}`
                      const serviceCount = Object.values(features).reduce(
                        (sum, chats) => sum + chats.length,
                        0
                      )
                      const isServiceExpanded = expandedServices.has(serviceKey)

                      return (
                        <Collapsible
                          key={serviceKey}
                          open={isServiceExpanded}
                          onOpenChange={() => toggleService(serviceKey)}
                        >
                          <CollapsibleTrigger className="w-full flex items-center gap-2 p-2 hover:bg-sidebar-accent rounded-md transition-colors mt-1">
                            {isServiceExpanded ? (
                              <CaretDown size={14} weight="bold" className="shrink-0 text-sidebar-foreground" />
                            ) : (
                              <CaretRight size={14} weight="bold" className="shrink-0 text-sidebar-foreground" />
                            )}
                            {isServiceExpanded ? (
                              <FolderOpen size={16} weight="duotone" className="shrink-0 text-accent" />
                            ) : (
                              <Folder size={16} weight="duotone" className="shrink-0 text-muted-foreground" />
                            )}
                            <span className="flex-1 text-left font-medium text-sm text-sidebar-foreground">
                              {service}
                            </span>
                            <Badge variant="outline" className="text-xs shrink-0">
                              {serviceCount}
                            </Badge>
                          </CollapsibleTrigger>

                          <CollapsibleContent className="pl-4">
                            {Object.entries(features).map(([feature, featureChats]) => {
                              const featureKey = `${domain}-${service}-${feature}`
                              const isFeatureExpanded = expandedFeatures.has(featureKey)

                              return (
                                <Collapsible
                                  key={featureKey}
                                  open={isFeatureExpanded}
                                  onOpenChange={() => toggleFeature(featureKey)}
                                >
                                  <CollapsibleTrigger className="w-full flex items-center gap-2 p-2 hover:bg-sidebar-accent rounded-md transition-colors mt-1">
                                    {isFeatureExpanded ? (
                                      <CaretDown size={12} weight="bold" className="shrink-0 text-sidebar-foreground" />
                                    ) : (
                                      <CaretRight size={12} weight="bold" className="shrink-0 text-sidebar-foreground" />
                                    )}
                                    <span className="flex-1 text-left text-sm text-sidebar-foreground">
                                      {feature}
                                    </span>
                                    <Badge variant="secondary" className="text-xs shrink-0">
                                      {featureChats.length}
                                    </Badge>
                                  </CollapsibleTrigger>

                                  <CollapsibleContent className="pl-4">
                                    {featureChats.map((chat) => (
                                      <button
                                        key={chat.id}
                                        onClick={() => onSelectChat(chat.id)}
                                        className={cn(
                                          'w-full text-left p-2 rounded-md transition-colors mt-1',
                                          'hover:bg-sidebar-accent',
                                          activeChat === chat.id
                                            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                                            : 'text-sidebar-foreground'
                                        )}
                                      >
                                        <div className="flex items-start gap-2">
                                          <ChatsTeardrop
                                            size={16}
                                            weight="duotone"
                                            className="shrink-0 mt-0.5"
                                          />
                                          <div className="flex-1 min-w-0">
                                            <div className="text-xs font-medium truncate">
                                              {chat.title}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                              {new Date(chat.updatedAt).toLocaleDateString()}
                                            </div>
                                          </div>
                                          {chat.messages.length > 0 && (
                                            <Badge variant="outline" className="text-xs shrink-0 h-5">
                                              {chat.messages.length}
                                            </Badge>
                                          )}
                                        </div>
                                      </button>
                                    ))}
                                  </CollapsibleContent>
                                </Collapsible>
                              )
                            })}
                          </CollapsibleContent>
                        </Collapsible>
                      )
                    })}
                  </CollapsibleContent>
                </Collapsible>
              )
            })
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
