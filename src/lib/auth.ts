import { apiRequest, clearAuthCache, getCurrentUserCache, setAccessToken, setCurrentUserCache } from '@/lib/api'
import { AuthUser } from '@/lib/types'

interface AuthResponse {
  user: ServerUser
  token: string
}

interface ServerUser {
  id: string
  email: string
  name: string
  role: 'technical' | 'business'
  avatarUrl: string
  createdAt: number
}

function mapAuthUser(user: ServerUser): AuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
    password: '',
  }
}

export async function signUp(
  email: string,
  password: string,
  name: string,
  role: 'technical' | 'business'
): Promise<AuthUser> {
  const data = await apiRequest<AuthResponse>('/v1/auth/signup', {
    method: 'POST',
    body: { email, password, name, role },
    requireAuth: false,
  })

  setAccessToken(data.token)
  const user = mapAuthUser(data.user)
  setCurrentUserCache(user)
  return user
}

export async function signIn(email: string, password: string): Promise<AuthUser> {
  const data = await apiRequest<AuthResponse>('/v1/auth/signin', {
    method: 'POST',
    body: { email, password },
    requireAuth: false,
  })

  setAccessToken(data.token)
  const user = mapAuthUser(data.user)
  setCurrentUserCache(user)
  return user
}

export async function setCurrentUser(user: AuthUser): Promise<void> {
  setCurrentUserCache(user)
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const data = await apiRequest<ServerUser>('/v1/auth/me', {
      method: 'GET',
      requireAuth: true,
    })
    const user = mapAuthUser(data)
    setCurrentUserCache(user)
    return user
  } catch {
    const cached = getCurrentUserCache<AuthUser>()
    if (!cached) {
      clearAuthCache()
      return null
    }

    return cached
  }
}

export async function signOut(): Promise<void> {
  try {
    await apiRequest<{ signedOut: boolean }>('/v1/auth/signout', {
      method: 'POST',
      requireAuth: true,
    })
  } finally {
    clearAuthCache()
  }
}
