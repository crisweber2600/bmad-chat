import { useState, useEffect } from 'react'
import { User, UserRole } from '@/lib/types'
import { signUp, signIn, setCurrentUser as saveCurrentUser, getCurrentUser, signOut as performSignOut } from '@/lib/auth'
import { toast } from 'sonner'

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoadingAuth, setIsLoadingAuth] = useState(true)

  useEffect(() => {
    loadCurrentUser()
  }, [])

  const loadCurrentUser = async () => {
    try {
      const authUser = await getCurrentUser()
      if (authUser) {
        const user: User = {
          id: authUser.id,
          name: authUser.name,
          avatarUrl: authUser.avatarUrl,
          email: authUser.email,
          role: authUser.role,
        }
        setCurrentUser(user)
        setIsAuthenticated(true)
      }
    } catch (error) {
      console.error('Failed to load user:', error)
    } finally {
      setIsLoadingAuth(false)
    }
  }

  const handleSignIn = async (email: string, password: string) => {
    try {
      const authUser = await signIn(email, password)
      await saveCurrentUser(authUser)
      const user: User = {
        id: authUser.id,
        name: authUser.name,
        avatarUrl: authUser.avatarUrl,
        email: authUser.email,
        role: authUser.role,
      }
      setCurrentUser(user)
      setIsAuthenticated(true)
      toast.success('Welcome back!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Sign in failed')
      throw error
    }
  }

  const handleSignUp = async (email: string, password: string, name: string, role: UserRole) => {
    try {
      const authUser = await signUp(email, password, name, role)
      await saveCurrentUser(authUser)
      const user: User = {
        id: authUser.id,
        name: authUser.name,
        avatarUrl: authUser.avatarUrl,
        email: authUser.email,
        role: authUser.role,
      }
      setCurrentUser(user)
      setIsAuthenticated(true)
      toast.success('Account created successfully!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Sign up failed')
      throw error
    }
  }

  const handleSignOut = async () => {
    await performSignOut()
    setCurrentUser(null)
    setIsAuthenticated(false)
    toast.info('Signed out successfully')
  }

  return {
    currentUser,
    isAuthenticated,
    isLoadingAuth,
    handleSignIn,
    handleSignUp,
    handleSignOut,
  }
}
