export const APP_CONSTANTS = {
  TITLE: 'BMAD',
  SUBTITLE: 'Momentum-First Platform',
  DESCRIPTION: 'Business Model Architecture Design Platform',
} as const

export const ROUTE_KEYS = {
  DASHBOARD: 'dashboard',
  CHAT: 'chat',
  PR: 'pr',
} as const

export const PANEL_BREAKPOINTS = {
  MOBILE: 768,
  CHAT_LIST_WIDTH: 320,
  RIGHT_PANEL_WIDTH: 384,
  RIGHT_PANEL_COLLAPSED_WIDTH: 48,
} as const

export const TIMING = {
  TYPING_DEBOUNCE: 300,
  PRESENCE_UPDATE: 5000,
  ANIMATION_DURATION: 300,
} as const
