import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Chat, Message, PullRequest, User, FileChange } from '@/lib/types'
import { ChatList } from '@/components/ChatList'
import { ChatMessage } from '@/components/ChatMessage'
import { ChatInput } from '@/components/ChatInput'
import { PRCard } from '@/components/PRCard'
import { PRDialog } from '@/components/PRDialog'
import { CreatePRDialog } from '@/components/CreatePRDialog'
import { FileDiffViewer } from '@/components/FileDiffViewer'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Toaster } from '@/components/ui/sonner'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { GitPullRequest, List, UserGear, Briefcase, FileText, X } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { useIsMobile } from '@/hooks/use-mobile'

function App() {
  const isMobile = useIsMobile()
  const [chats, setChats] = useKV<Chat[]>('chats', [])
  const [pullRequests, setPullRequests] = useKV<PullRequest[]>('pull-requests', [])
  const [activeChat, setActiveChat] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [selectedPR, setSelectedPR] = useState<PullRequest | null>(null)
  const [prDialogOpen, setPRDialogOpen] = useState(false)
  const [createPRDialogOpen, setCreatePRDialogOpen] = useState(false)
  const [pendingChanges, setPendingChanges] = useState<FileChange[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [chatListOpen, setChatListOpen] = useState(false)
  const [rightPanelOpen, setRightPanelOpen] = useState(false)

  useEffect(() => {
    loadCurrentUser()
  }, [])

  const loadCurrentUser = async () => {
    try {
      const sparkUser = await window.spark.user()
      if (sparkUser) {
        const user: User = {
          id: String(sparkUser.id),
          name: sparkUser.login || 'User',
          avatarUrl: sparkUser.avatarUrl || '',
          email: sparkUser.email || '',
          role: Math.random() > 0.5 ? 'technical' : 'business',
        }
        setCurrentUser(user)
      }
    } catch (error) {
      const mockUser: User = {
        id: 'user-1',
        name: 'Demo User',
        avatarUrl: '',
        email: 'demo@example.com',
        role: 'technical',
      }
      setCurrentUser(mockUser)
    }
  }

  const handleNewChat = () => {
    const newChat: Chat = {
      id: `chat-${Date.now()}`,
      title: 'New Conversation',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      participants: currentUser ? [currentUser.id] : [],
    }
    
    setChats((current) => [newChat, ...(current || [])])
    setActiveChat(newChat.id)
    if (isMobile) {
      setChatListOpen(false)
    }
  }

  const handleSendMessage = async (content: string) => {
    if (!activeChat || !currentUser) return

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      chatId: activeChat,
      content,
      role: 'user',
      timestamp: Date.now(),
      userId: currentUser.id,
    }

    setChats((current) =>
      (current || []).map((chat) =>
        chat.id === activeChat
          ? {
              ...chat,
              messages: [...chat.messages, userMessage],
              updatedAt: Date.now(),
              title: chat.messages.length === 0 ? content.slice(0, 50) : chat.title,
            }
          : chat
      )
    )

    setIsTyping(true)

    try {
      const promptText = `You are a helpful AI assistant in a collaborative documentation platform. 
The user is a ${currentUser.role} user working on documentation.

User message: ${content}

Based on this conversation, generate:
1. A helpful response to the user
2. Suggested markdown documentation changes (if applicable)

Respond in a conversational way. If the conversation suggests documentation updates, mention what files should be updated.

Format your response as JSON with this structure:
{
  "response": "your conversational response here",
  "suggestedChanges": [
    {
      "path": "docs/example.md",
      "additions": ["# New Section", "Content here"],
      "deletions": ["# Old Section"],
      "status": "pending"
    }
  ]
}`

      const response = await window.spark.llm(promptText, 'gpt-4o', true)
      const parsed = JSON.parse(response)

      const aiMessage: Message = {
        id: `msg-${Date.now()}-ai`,
        chatId: activeChat,
        content: parsed.response,
        role: 'assistant',
        timestamp: Date.now(),
        fileChanges: parsed.suggestedChanges || [],
      }

      setChats((current) =>
        (current || []).map((chat) =>
          chat.id === activeChat
            ? {
                ...chat,
                messages: [...chat.messages, aiMessage],
                updatedAt: Date.now(),
              }
            : chat
        )
      )

      if (parsed.suggestedChanges && parsed.suggestedChanges.length > 0) {
        setPendingChanges((current) => [...(current || []), ...parsed.suggestedChanges])
        toast.success('Documentation changes suggested')
      }
    } catch (error) {
      toast.error('Failed to get AI response')
      console.error(error)
    } finally {
      setIsTyping(false)
    }
  }

  const handleCreatePR = (title: string, description: string) => {
    if (!currentUser || (pendingChanges || []).length === 0) return

    const newPR: PullRequest = {
      id: `pr-${Date.now()}`,
      title,
      description,
      chatId: activeChat || '',
      author: currentUser.name,
      status: 'open',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      fileChanges: (pendingChanges || []).map((change) => ({ ...change, status: 'staged' as const })),
      comments: [],
      approvals: [],
    }

    setPullRequests((current) => [newPR, ...(current || [])])
    setPendingChanges([])
    toast.success('Pull request created')
  }

  const handleMergePR = (prId: string) => {
    setPullRequests((current) =>
      (current || []).map((pr) =>
        pr.id === prId
          ? { ...pr, status: 'merged' as const, updatedAt: Date.now() }
          : pr
      )
    )
    setPRDialogOpen(false)
    toast.success('Pull request merged successfully')
  }

  const handleClosePR = (prId: string) => {
    setPullRequests((current) =>
      (current || []).map((pr) =>
        pr.id === prId
          ? { ...pr, status: 'closed' as const, updatedAt: Date.now() }
          : pr
      )
    )
    setPRDialogOpen(false)
    toast.info('Pull request closed')
  }

  const handleApprovePR = (prId: string) => {
    if (!currentUser) return

    setPullRequests((current) =>
      (current || []).map((pr) =>
        pr.id === prId && !pr.approvals.includes(currentUser.id)
          ? { ...pr, approvals: [...pr.approvals, currentUser.id], updatedAt: Date.now() }
          : pr
      )
    )
    toast.success('Pull request approved')
  }

  const handleCommentPR = (prId: string, content: string) => {
    if (!currentUser) return

    setPullRequests((current) =>
      (current || []).map((pr) =>
        pr.id === prId
          ? {
              ...pr,
              comments: [
                ...pr.comments,
                {
                  id: `comment-${Date.now()}`,
                  prId,
                  author: currentUser.name,
                  content,
                  timestamp: Date.now(),
                },
              ],
              updatedAt: Date.now(),
            }
          : pr
      )
    )
  }

  const activeChatData = (chats || []).find((c) => c.id === activeChat)
  const openPRs = (pullRequests || []).filter((pr) => pr.status === 'open')
  const mergedPRs = (pullRequests || []).filter((pr) => pr.status === 'merged')

  const handleSelectChat = (chatId: string) => {
    setActiveChat(chatId)
    if (isMobile) {
      setChatListOpen(false)
    }
  }

  const handleViewPR = (pr: PullRequest) => {
    setSelectedPR(pr)
    setPRDialogOpen(true)
    if (isMobile) {
      setRightPanelOpen(false)
    }
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <Toaster position="top-right" />
      
      <header className="h-14 md:h-16 border-b bg-card px-4 md:px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 md:gap-4">
          {isMobile ? (
            <Sheet open={chatListOpen} onOpenChange={setChatListOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <List size={20} weight="bold" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-[85vw] max-w-sm">
                <ChatList
                  chats={chats || []}
                  activeChat={activeChat}
                  onSelectChat={handleSelectChat}
                  onNewChat={handleNewChat}
                />
              </SheetContent>
            </Sheet>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setChatListOpen(!chatListOpen)}
            >
              <List size={20} weight="bold" />
            </Button>
          )}
          <h1 className="text-lg md:text-2xl font-bold tracking-tight">DocFlow</h1>
        </div>
        
        {currentUser && (
          <div className="flex items-center gap-2 md:gap-3">
            <div className="hidden sm:block text-right">
              <div className="text-xs md:text-sm font-medium">{currentUser.name}</div>
              <Badge variant="outline" className="text-xs">
                {currentUser.role === 'technical' ? (
                  <>
                    <UserGear size={12} className="mr-1" />
                    Technical
                  </>
                ) : (
                  <>
                    <Briefcase size={12} className="mr-1" />
                    Business
                  </>
                )}
              </Badge>
            </div>
            <Avatar className="h-8 w-8 md:h-10 md:w-10">
              <AvatarImage src={currentUser.avatarUrl} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs md:text-sm">
                {currentUser.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        )}
      </header>

      <div className="flex-1 flex min-h-0 relative">
        {!isMobile && (
          <div className={`${chatListOpen ? 'w-80' : 'w-0'} transition-all duration-300`}>
            {chatListOpen && (
              <ChatList
                chats={chats || []}
                activeChat={activeChat}
                onSelectChat={setActiveChat}
                onNewChat={handleNewChat}
              />
            )}
          </div>
        )}

        <div className="flex-1 flex flex-col min-w-0">
          {activeChatData ? (
            <>
              <ScrollArea className="flex-1 p-3 md:p-6">
                <div className="max-w-4xl mx-auto">
                  {activeChatData.messages.map((message) => (
                    <ChatMessage
                      key={message.id}
                      message={message}
                      user={currentUser || undefined}
                    />
                  ))}
                  {isTyping && (
                    <div className="flex gap-3 mb-4">
                      <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
              <ChatInput
                onSend={handleSendMessage}
                disabled={isTyping}
                placeholder="Type your message..."
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground px-4">
              <div className="text-center">
                <h2 className="text-xl font-semibold mb-2">Welcome to DocFlow</h2>
                <p className="text-sm">Select a chat or start a new conversation</p>
              </div>
            </div>
          )}
        </div>

        {isMobile ? (
          <Sheet open={rightPanelOpen} onOpenChange={setRightPanelOpen}>
            <SheetTrigger asChild>
              <Button
                className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg z-10"
                size="icon"
              >
                <FileText size={24} weight="duotone" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="p-0 w-[85vw] max-w-sm">
              <div className="h-full flex flex-col">
                <Tabs defaultValue="changes" className="flex-1 flex flex-col">
                  <TabsList className="w-full rounded-none border-b">
                    <TabsTrigger value="changes" className="flex-1">
                      Changes
                      {(pendingChanges || []).length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {(pendingChanges || []).length}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="prs" className="flex-1">
                      <GitPullRequest size={16} className="mr-1" />
                      PRs
                      {openPRs.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {openPRs.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="changes" className="flex-1 flex flex-col mt-0">
                    <ScrollArea className="flex-1 p-4">
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-semibold mb-3">Pending Changes</h3>
                          <FileDiffViewer fileChanges={pendingChanges || []} />
                        </div>
                        
                        {(pendingChanges || []).length > 0 && (
                          <Button
                            onClick={() => setCreatePRDialogOpen(true)}
                            className="w-full"
                          >
                            <GitPullRequest size={18} className="mr-2" />
                            Create Pull Request
                          </Button>
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="prs" className="flex-1 flex flex-col mt-0">
                    <ScrollArea className="flex-1 p-4">
                      <div className="space-y-4">
                        {openPRs.length > 0 && (
                          <div>
                            <h3 className="font-semibold mb-3">Open PRs</h3>
                            <div className="space-y-2">
                              {openPRs.map((pr) => (
                                <PRCard
                                  key={pr.id}
                                  pr={pr}
                                  onView={() => handleViewPR(pr)}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {mergedPRs.length > 0 && (
                          <>
                            {openPRs.length > 0 && <Separator className="my-4" />}
                            <div>
                              <h3 className="font-semibold mb-3">Merged</h3>
                              <div className="space-y-2">
                                {mergedPRs.slice(0, 5).map((pr) => (
                                  <PRCard
                                    key={pr.id}
                                    pr={pr}
                                    onView={() => handleViewPR(pr)}
                                  />
                                ))}
                              </div>
                            </div>
                          </>
                        )}

                        {(pullRequests || []).length === 0 && (
                          <div className="text-center py-8 text-muted-foreground text-sm">
                            No pull requests yet
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </div>
            </SheetContent>
          </Sheet>
        ) : (
          <div className="w-96 border-l bg-card flex flex-col">
            <Tabs defaultValue="changes" className="flex-1 flex flex-col">
              <TabsList className="w-full rounded-none border-b">
                <TabsTrigger value="changes" className="flex-1">
                  Changes
                  {(pendingChanges || []).length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {(pendingChanges || []).length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="prs" className="flex-1">
                  <GitPullRequest size={16} className="mr-1" />
                  PRs
                  {openPRs.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {openPRs.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="changes" className="flex-1 flex flex-col mt-0">
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-3">Pending Changes</h3>
                      <FileDiffViewer fileChanges={pendingChanges || []} />
                    </div>
                    
                    {(pendingChanges || []).length > 0 && (
                      <Button
                        onClick={() => setCreatePRDialogOpen(true)}
                        className="w-full"
                      >
                        <GitPullRequest size={18} className="mr-2" />
                        Create Pull Request
                      </Button>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="prs" className="flex-1 flex flex-col mt-0">
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {openPRs.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-3">Open PRs</h3>
                        <div className="space-y-2">
                          {openPRs.map((pr) => (
                            <PRCard
                              key={pr.id}
                              pr={pr}
                              onView={() => handleViewPR(pr)}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {mergedPRs.length > 0 && (
                      <>
                        {openPRs.length > 0 && <Separator className="my-4" />}
                        <div>
                          <h3 className="font-semibold mb-3">Merged</h3>
                          <div className="space-y-2">
                            {mergedPRs.slice(0, 5).map((pr) => (
                              <PRCard
                                key={pr.id}
                                pr={pr}
                                onView={() => handleViewPR(pr)}
                              />
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {(pullRequests || []).length === 0 && (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        No pull requests yet
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>

      <PRDialog
        pr={selectedPR}
        open={prDialogOpen}
        onClose={() => setPRDialogOpen(false)}
        onMerge={handleMergePR}
        onClosePR={handleClosePR}
        onApprove={handleApprovePR}
        onComment={handleCommentPR}
        currentUser={currentUser}
      />

      <CreatePRDialog
        open={createPRDialogOpen}
        onClose={() => setCreatePRDialogOpen(false)}
        onCreate={handleCreatePR}
        fileChanges={pendingChanges || []}
      />
    </div>
  )
}

export default App
