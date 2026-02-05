import { AuthUser } from '@/lib/types'

const USERS_KEY = 'docflow-users'
const CURRENT_USER_KEY = 'docflow-current-user'

export async function signUp(
  email: string,
  password: string,
  name: string,
  role: 'technical' | 'business'
): Promise<AuthUser> {
  const users = await getAllUsers()
  
  const existingUser = users.find((u) => u.email === email)
  if (existingUser) {
    throw new Error('User with this email already exists')
  }

  const newUser: AuthUser = {
    id: `user-${Date.now()}`,
    email,
    password,
    name,
    role,
    avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
    createdAt: Date.now(),
  }

  users.push(newUser)
  await window.spark.kv.set(USERS_KEY, users)
  
  return newUser
}

export async function signIn(email: string, password: string): Promise<AuthUser> {
  const users = await getAllUsers()
  
  const user = users.find((u) => u.email === email && u.password === password)
  if (!user) {
    throw new Error('Invalid email or password')
  }

  return user
}

export async function setCurrentUser(user: AuthUser): Promise<void> {
  await window.spark.kv.set(CURRENT_USER_KEY, user)
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const user = await window.spark.kv.get<AuthUser>(CURRENT_USER_KEY)
  return user || null
}

export async function signOut(): Promise<void> {
  await window.spark.kv.delete(CURRENT_USER_KEY)
}

async function getAllUsers(): Promise<AuthUser[]> {
  const users = await window.spark.kv.get<AuthUser[]>(USERS_KEY)
  return users || []
}
