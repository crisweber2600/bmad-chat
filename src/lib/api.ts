export interface ResponseEnvelope<T> {
  success: boolean
  statusCode: number
  message: string
  data: T
  timestamp: string
  traceId?: string
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

const TOKEN_KEY = 'bmad-access-token'
const USER_KEY = 'bmad-current-user'
const DEFAULT_BASE_URL = 'http://localhost:8080'

export function getApiBaseUrl(): string {
  return (import.meta.env.VITE_API_BASE_URL as string | undefined) || DEFAULT_BASE_URL
}

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setAccessToken(token: string | null): void {
  if (!token) {
    localStorage.removeItem(TOKEN_KEY)
    return
  }

  localStorage.setItem(TOKEN_KEY, token)
}

export function getCurrentUserCache<T>(): T | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as T
  } catch {
    localStorage.removeItem(USER_KEY)
    return null
  }
}

export function setCurrentUserCache<T>(user: T | null): void {
  if (!user) {
    localStorage.removeItem(USER_KEY)
    return
  }

  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearAuthCache(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  headers?: Record<string, string>
  requireAuth?: boolean
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { method = 'GET', body, headers = {}, requireAuth = true } = options
  const token = getAccessToken()
  const requestHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    ...headers,
  }

  if (requireAuth && token) {
    requestHeaders['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method,
    headers: requestHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  let payload: ResponseEnvelope<T> | null = null
  try {
    payload = (await response.json()) as ResponseEnvelope<T>
  } catch {
    if (response.ok) {
      return undefined as T
    }
  }

  if (!response.ok || !payload || payload.success === false) {
    const message = payload?.message || `Request failed: ${response.status}`
    throw new ApiError(message, payload?.statusCode || response.status)
  }

  return payload.data
}
