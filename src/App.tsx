import { useEffect } from 'react'
import { AuthForm } from '@/components/AuthForm'
import { MomentumDashboard } from '@/components/MomentumDashboard'
import { NewChatDialog } from '@/components/NewChatDialog'
import { ChatList } from '@/components/ChatList'
import { ChatMessage } from '@/components/ChatMessage'
import { ChatInput } from '@/components/ChatInput'
import { PRCard } from '@/components/PRCard'
import { PRDialog } from '@/components/PRDialog'
import { CreatePRDialog } from '@/components/CreatePRDialog'
import { FileDiffViewer } from '@/components/FileDiffViewer'
import { ActiveUsers } from '@/components/ActiveUsers'
import { TypingIndicator } from '@/components/TypingIndicator'
import { ActivityFeed } from '@/components/ActivityFeed'
import { DecisionCenterPanel } from '@/components/DecisionCenterPanel'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Toaster } from '@/components/ui/sonner'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { GitPullRequest, List, UserGear, Briefcase, FileText, ChartLine, SignOut, House, CaretLeft, CaretRight } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import { useChats } from '@/hooks/use-chats'
import { usePullRequests } from '@/hooks/use-pull-requests'
import { usePendingChanges } from '@/hooks/use-pending-changes'
import { useUIState } from '@/hooks/use-ui-state'
import { useChatActions } from '@/hooks/use-chat-actions'
import { useCollaboration } from '@/hooks/use-collaboration'
import { useDecisions } from '@/hooks/use-decisions'

function App() {
  const { currentUser, isAuthenticated, isLoadingAuth, handleSignIn, handleSignUp, handleSignOut } = useAuth()
  
  const { chats, createChat, addMessage, addTranslation, getChatById, getOrganization } = useChats()
  
  const {
    pullRequests,
    createPR,
    mergePR,
    closePR,
    approvePR,
    commentOnPR,
    addLineComment: addPRLineComment,
    resolveLineComment: resolvePRLineComment,
    toggleLineCommentReaction: togglePRLineCommentReaction,
    getOpenPRs,
    getMergedPRs,
  } = usePullRequests()

  const {
    decisions,
    isLoadingDecisions,
    loadDecisions,
    createDecision,
    lockDecision,
    unlockDecision,
    getHistory,
    getConflicts,
    resolveConflict,
  } = useDecisions()
  
  const {
    pendingChanges,
    addChanges,
    clearChanges,
    addLineComment: addPendingLineComment,
    resolveLineComment: resolvePendingLineComment,
    toggleLineCommentReaction: togglePendingLineCommentReaction,
  } = usePendingChanges()
  
  const {
    isMobile,
    activeChat,
    selectedPR,
    prDialogOpen,
    setPRDialogOpen,
    createPRDialogOpen,
    setCreatePRDialogOpen,
    newChatDialogOpen,
    setNewChatDialogOpen,
    isTyping,
    setIsTyping,
    chatListOpen,
    setChatListOpen,
    rightPanelOpen,
    setRightPanelOpen,
    rightPanelCollapsed,
    setRightPanelCollapsed,
    showDashboard,
    handleSelectChat,
    handleViewPR,
    handleGoHome,
    handleNewChat,
  } = useUIState()
  
  const { 
    activeUsers, 
    typingUsers, 
    recentEvents,
    connectionStatus,
    setTyping,
    broadcastEvent,
  } = useCollaboration(currentUser, activeChat)

  const { handleSendMessage, handleTranslateMessage, handleTypingChange } = useChatActions(
    activeChat,
    currentUser,
    addMessage,
    addTranslation,
    addChanges,
    setIsTyping,
    setTyping,
    broadcastEvent
  )

  const handleCreateChat = async (domain: string, service: string, feature: string, title: string) => {
    if (!currentUser) return
    const newChat = await createChat(domain, service, feature, title)
    handleSelectChat(newChat.id)
    toast.success('Chat created')
  }

  const handleCreatePR = async (title: string, description: string) => {
    if (!currentUser || !pendingChanges.length) return
    await createPR(title, description, activeChat || '', currentUser, pendingChanges, broadcastEvent)
    clearChanges()
    setCreatePRDialogOpen(false)
  }

  const handleMergePR = async (prId: string) => {
    await mergePR(prId, broadcastEvent)
    setPRDialogOpen(false)
  }

  const handleClosePR = async (prId: string) => {
    await closePR(prId)
    setPRDialogOpen(false)
  }

  const handleApprovePR = async (prId: string) => {
    if (!currentUser) return
    await approvePR(prId)
  }

  const handleCommentPR = async (prId: string, content: string) => {
    if (!currentUser) return
    await commentOnPR(prId, content)
  }

  const handleAddLineComment = async (prId: string, fileId: string, lineNumber: number, lineType: 'addition' | 'deletion' | 'unchanged', content: string, parentId?: string) => {
    if (!currentUser) return
    await addPRLineComment(prId, fileId, lineNumber, lineType, content, currentUser, parentId, broadcastEvent)
  }

  const handleResolveLineComment = async (prId: string, commentId: string) => {
    await resolvePRLineComment(prId, commentId)
  }

  const handleAddPendingLineComment = (fileId: string, lineNumber: number, lineType: 'addition' | 'deletion' | 'unchanged', content: string, parentId?: string) => {
    if (!currentUser) return
    addPendingLineComment(fileId, lineNumber, lineType, content, currentUser, parentId)
  }

  const handleResolvePendingLineComment = (commentId: string) => {
    resolvePendingLineComment(commentId)
  }

  const handleToggleLineCommentReaction = async (prId: string, commentId: string, emoji: string) => {
    if (!currentUser) return
    await togglePRLineCommentReaction(prId, commentId, emoji)
  }

  const handleTogglePendingLineCommentReaction = (commentId: string, emoji: string) => {
    if (!currentUser) return
    togglePendingLineCommentReaction(commentId, emoji, currentUser)
  }

  const handleTranslateMessageWrapper = async (messageId: string) => {
    if (!currentUser || !activeChat) return
    const chat = chats.find((c) => c.id === activeChat)
    if (!chat) return
    const message = chat.messages.find((m) => m.id === messageId)
    if (!message) return
    await handleTranslateMessage(messageId)
  }

  useEffect(() => {
    if (!activeChat) return
    loadDecisions(activeChat)
  }, [activeChat, loadDecisions])

  const refreshDecisions = async () => {
    if (!activeChat) return
    await loadDecisions(activeChat)
  }

  const handleCreateDecision = async (title: string, value: Record<string, any>) => {
    if (!activeChat) return
    await createDecision(activeChat, title, value)
    await refreshDecisions()
  }

  const handleLockDecision = async (decisionId: string) => {
    await lockDecision(decisionId)
    await refreshDecisions()
  }

  const handleUnlockDecision = async (decisionId: string) => {
    await unlockDecision(decisionId)
    await refreshDecisions()
  }

  const handleResolveConflict = async (decisionId: string, conflictId: string, resolution: string) => {
    await resolveConflict(decisionId, conflictId, resolution)
    await refreshDecisions()
  }

  const activeChatData = chats.find((c) => c.id === activeChat)
  const openPRs = (pullRequests || []).filter((pr) => pr.status === 'open' || pr.status === 'approved')
  const mergedPRs = (pullRequests || []).filter((pr) => pr.status === 'merged')
  const openDecisionConflicts = decisions.reduce((total, decision) => total + (decision.openConflictCount || 0), 0)
  const organization = getOrganization()

  if (isLoadingAuth) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-2xl font-bold mb-2">BMAD</div>
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <AuthForm onSignIn={handleSignIn} onSignUp={handleSignUp} />
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <Toaster position="top-right" />
      {connectionStatus !== 'connected' && (
        <div className="h-8 shrink-0 bg-amber-100 text-amber-900 text-xs font-medium px-4 flex items-center">
          {connectionStatus === 'reconnecting' && 'Reconnecting to collaboration stream...'}
          {connectionStatus === 'connecting' && 'Connecting to collaboration stream...'}
          {connectionStatus === 'disconnected' && 'Realtime connection lost. Retrying...'}
        </div>
      )}
      
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
          <Button
            variant="ghost"
            size="icon"
            onClick={handleGoHome}
            title="Dashboard"
          >
            <House size={20} weight="bold" />
          </Button>
          <h1 className="text-lg md:text-2xl font-bold tracking-tight">BMAD</h1>
          <Badge variant="outline" className="hidden md:inline-flex text-xs">
            Momentum-First Platform
          </Badge>
        </div>
        
        <div className="flex items-center gap-3 md:gap-4">
          {activeUsers.length > 0 && (
            <>
              <ActiveUsers users={activeUsers} maxVisible={isMobile ? 3 : 5} />
              <Separator orientation="vertical" className="h-8 hidden md:block" />
            </>
          )}
          
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
              <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign Out">
                <SignOut size={20} weight="bold" />
              </Button>
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 flex min-h-0 relative">
        {!isMobile && (
          <div className={`${chatListOpen ? 'w-80' : 'w-0'} transition-all duration-300`}>
            {chatListOpen && (
              <ChatList
                chats={chats || []}
                activeChat={activeChat}
                onSelectChat={handleSelectChat}
                onNewChat={handleNewChat}
              />
            )}
          </div>
        )}

        <div className="flex-1 flex flex-col min-w-0">
          {showDashboard ? (
            <ScrollArea className="flex-1">
              <MomentumDashboard
                chats={chats || []}
                pullRequests={pullRequests || []}
                currentUser={currentUser!}
                onNewChat={handleNewChat}
                onSelectChat={handleSelectChat}
                onViewPR={handleViewPR}
              />
            </ScrollArea>
          ) : activeChatData ? (
            <>
              <ScrollArea className="flex-1 p-3 md:p-6">
                <div className="max-w-4xl mx-auto">
                  {activeChatData.messages.map((message) => (
                    <ChatMessage
                      key={message.id}
                      message={message}
                      user={currentUser || undefined}
                      onTranslate={handleTranslateMessageWrapper}
                    />
                  ))}
                  {typingUsers.length > 0 && (
                    <TypingIndicator typingUsers={typingUsers} />
                  )}
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
                onTypingChange={setTyping}
                disabled={isTyping}
                placeholder="Type your message..."
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground px-4">
              <div className="text-center">
                <h2 className="text-xl font-semibold mb-2">Welcome to BMAD</h2>
                <p className="text-sm mb-4">Select a chat or start a new conversation</p>
                <Button onClick={handleGoHome} variant="outline">
                  <House size={18} className="mr-2" />
                  Go to Dashboard
                </Button>
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
                    <TabsTrigger value="decisions" className="flex-1">
                      Decisions
                      {openDecisionConflicts > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {openDecisionConflicts}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="activity" className="flex-1">
                      <ChartLine size={16} className="mr-1" />
                      Activity
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="changes" className="flex-1 flex flex-col mt-0">
                    <ScrollArea className="flex-1 p-4">
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-semibold mb-3">Pending Changes</h3>
                          <FileDiffViewer 
                            fileChanges={pendingChanges || []}
                            onAddLineComment={handleAddPendingLineComment}
                            onResolveComment={handleResolvePendingLineComment}
                            onToggleReaction={handleTogglePendingLineCommentReaction}
                            currentUser={currentUser}
                          />
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

                  <TabsContent value="activity" className="flex-1 flex flex-col mt-0">
                    <ScrollArea className="flex-1 p-4">
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-semibold mb-3">Recent Activity</h3>
                          <ActivityFeed events={recentEvents} maxVisible={20} />
                        </div>
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="decisions" className="flex-1 flex flex-col mt-0">
                    <DecisionCenterPanel
                      activeChat={activeChat}
                      decisions={decisions}
                      isLoading={isLoadingDecisions}
                      onRefresh={refreshDecisions}
                      onCreateDecision={handleCreateDecision}
                      onLockDecision={handleLockDecision}
                      onUnlockDecision={handleUnlockDecision}
                      onGetHistory={getHistory}
                      onGetConflicts={getConflicts}
                      onResolveConflict={handleResolveConflict}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            </SheetContent>
          </Sheet>
        ) : (
          <div className={`${rightPanelCollapsed ? 'w-12' : 'w-96'} border-l bg-card flex flex-col transition-all duration-300`}>
            {rightPanelCollapsed ? (
              <div className="flex flex-col items-center gap-4 pt-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setRightPanelCollapsed(false)}
                  title="Expand panel"
                >
                  <CaretLeft size={20} weight="bold" />
                </Button>
                {(pendingChanges || []).length > 0 && (
                  <Badge variant="secondary" className="rounded-full h-6 w-6 p-0 flex items-center justify-center text-xs">
                    {(pendingChanges || []).length}
                  </Badge>
                )}
                {openPRs.length > 0 && (
                  <Badge variant="secondary" className="rounded-full h-6 w-6 p-0 flex items-center justify-center text-xs">
                    {openPRs.length}
                  </Badge>
                )}
                {openDecisionConflicts > 0 && (
                  <Badge variant="secondary" className="rounded-full h-6 w-6 p-0 flex items-center justify-center text-xs">
                    {openDecisionConflicts}
                  </Badge>
                )}
              </div>
            ) : (
              <Tabs defaultValue="changes" className="flex-1 flex flex-col">
                <div className="flex items-center border-b">
                  <TabsList className="flex-1 rounded-none border-0 h-auto">
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
                    <TabsTrigger value="decisions" className="flex-1">
                      Decisions
                      {openDecisionConflicts > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {openDecisionConflicts}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="activity" className="flex-1">
                      <ChartLine size={16} className="mr-1" />
                      Activity
                    </TabsTrigger>
                  </TabsList>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setRightPanelCollapsed(true)}
                    title="Collapse panel"
                    className="shrink-0 mr-2"
                  >
                    <CaretRight size={20} weight="bold" />
                  </Button>
                </div>

              <TabsContent value="changes" className="flex-1 flex flex-col mt-0">
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-3">Pending Changes</h3>
                      <FileDiffViewer 
                        fileChanges={pendingChanges || []}
                        onAddLineComment={handleAddPendingLineComment}
                        onResolveComment={handleResolvePendingLineComment}
                        onToggleReaction={handleTogglePendingLineCommentReaction}
                        currentUser={currentUser}
                      />
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

              <TabsContent value="activity" className="flex-1 flex flex-col mt-0">
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-3">Recent Activity</h3>
                      <ActivityFeed events={recentEvents} maxVisible={20} />
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="decisions" className="flex-1 flex flex-col mt-0">
                <DecisionCenterPanel
                  activeChat={activeChat}
                  decisions={decisions}
                  isLoading={isLoadingDecisions}
                  onRefresh={refreshDecisions}
                  onCreateDecision={handleCreateDecision}
                  onLockDecision={handleLockDecision}
                  onUnlockDecision={handleUnlockDecision}
                  onGetHistory={getHistory}
                  onGetConflicts={getConflicts}
                  onResolveConflict={handleResolveConflict}
                />
              </TabsContent>
            </Tabs>
            )}
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
        onAddLineComment={handleAddLineComment}
        onResolveLineComment={handleResolveLineComment}
        onToggleReaction={handleToggleLineCommentReaction}
      />

      <CreatePRDialog
        open={createPRDialogOpen}
        onClose={() => setCreatePRDialogOpen(false)}
        onCreate={handleCreatePR}
        fileChanges={pendingChanges || []}
      />

      <NewChatDialog
        open={newChatDialogOpen}
        onClose={() => setNewChatDialogOpen(false)}
        onCreate={handleCreateChat}
        existingDomains={organization.domains}
        existingServices={organization.services}
        existingFeatures={organization.features}
      />
    </div>
  )
}

export default App
