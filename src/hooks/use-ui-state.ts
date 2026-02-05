import { useState } from 'react'
import { PullRequest } from '@/lib/types'
import { useIsMobile } from './use-mobile'

export function useUIState() {
  const isMobile = useIsMobile()
  
  const [activeChat, setActiveChat] = useState<string | null>(null)
  const [selectedPR, setSelectedPR] = useState<PullRequest | null>(null)
  const [prDialogOpen, setPRDialogOpen] = useState(false)
  const [createPRDialogOpen, setCreatePRDialogOpen] = useState(false)
  const [newChatDialogOpen, setNewChatDialogOpen] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [chatListOpen, setChatListOpen] = useState(false)
  const [rightPanelOpen, setRightPanelOpen] = useState(false)
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false)
  const [showDashboard, setShowDashboard] = useState(true)

  const handleSelectChat = (chatId: string) => {
    setActiveChat(chatId)
    setShowDashboard(false)
    if (isMobile) {
      setChatListOpen(false)
    }
  }

  const handleViewPR = (pr: PullRequest) => {
    setSelectedPR(pr)
    setPRDialogOpen(true)
    setShowDashboard(false)
    if (isMobile) {
      setRightPanelOpen(false)
    }
  }

  const handleGoHome = () => {
    setActiveChat(null)
    setShowDashboard(true)
  }

  const handleNewChat = () => {
    setNewChatDialogOpen(true)
  }

  const handleCreateChat = (chatId: string) => {
    setActiveChat(chatId)
    if (isMobile) {
      setChatListOpen(false)
    }
  }

  return {
    isMobile,
    activeChat,
    setActiveChat,
    selectedPR,
    setSelectedPR,
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
    setShowDashboard,
    handleSelectChat,
    handleViewPR,
    handleGoHome,
    handleNewChat,
    handleCreateChat,
  }
}
