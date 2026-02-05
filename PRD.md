# Planning Guide

BMAD-as-a-Service: An intelligent collaboration ecosystem where AI orchestrates async decision-making between non-technical co-founders (Sarah) and technical co-founders (Marcus), meeting each in their native habitat while ensuring projects never stall. The platform enforces momentum-first workflows with proportional ceremony, intelligent question routing based on expertise, and commitment hierarchy where engineers commit last, not first.

**Experience Qualities**: 
1. **Momentum-First** - Projects can always move forward. Async by default with AI-triggered sync, provisional commits with timeouts, and cross-pollination when queues are empty ensure zero stalling.
2. **Proportionally Ceremonial** - Friction matches stakes. Small decisions flow fast with AI defaults, big decisions (architecture locks, pivots) get sync ceremonies with dual approval.
3. **Transparently Intelligent** - Every decision is traceable with blast radius visibility. AI orchestrates routing, detects deadlocks, suggests sync moments, but humans retain final authority.

**Complexity Level**: Complex Application (advanced functionality, likely with multiple views)
This application requires intelligent question routing, momentum tracking, role-based async workflows, AI orchestration layer, Git integration for requirements storage, blast radius detection, cross-domain collaboration, structured sync protocols, and ecosystem health monitoring - all of which constitute an advanced multi-role application with sophisticated AI coordination.

## Core Architectural Principles

1. **Friction ∝ Stakes** - Small decisions flow fast. Big decisions get ceremony.
2. **Everyone Has a Home** - Sarah: Web UI. Marcus: Git + CLI. Both: Teams.
3. **AI Amplifies, Humans Decide** - AI proposes, translates, detects. Humans have final say.
4. **Async by Default, Sync by Exception** - Most work async. Sync for alignment + ceremonies.
5. **Momentum is Sacred** - Projects must always be able to move forward.
6. **Transparency > Permission** - Everyone sees everything. Action requires appropriate role.
7. **Every Decision is Traceable** - Who, what, when, why - always answerable.

## Essential Features

### Momentum-First Dashboard
- **Functionality**: Landing page shows project trajectory, velocity indicators, next action items, and decision queue status with progress narrative
- **Purpose**: Sarah's #1 need - clarity on "what's going on" and "what's next" without technical complexity
- **Trigger**: User logs in or navigates to home
- **Progression**: User opens app → Dashboard displays project state as human-readable story → Shows momentum indicators (decisions/day, stall frequency) → Highlights next action with "Accept for Now" pattern → Offers: Continue, Skip, Get Help, AI Suggest → Never presents dead-ends
- **Success criteria**: State loads under 1 second, narrative is human-readable, momentum metrics display correctly, next action is always available, anti-stall guarantee enforced
- **Backend Integration**: ✅ Uses window.spark.kv for decision history, velocity calculations, AI generates narrative from recent activity

### Intelligent Question Routing
- **Functionality**: AI analyzes questions and routes to appropriate role (technical to Marcus, business to Sarah) with cross-pollination when queues empty
- **Purpose**: Meet users in their expertise domain, prevent context-switching, enable cross-domain contribution during idle time
- **Trigger**: New decision/question created, or user queue becomes empty/blocked
- **Progression**: Question created → AI analyzes context/complexity → Routes to appropriate queue → User works their queue → Queue empty/blocked → System offers cross-pollination: "Help with a business question while you wait?" → User accepts → Question appears with full context translation → Contribution recorded
- **Success criteria**: Technical questions reach technical users, business questions reach business users, routing accuracy >85%, cross-pollination increases utilization, users feel questions are relevant
- **Backend Integration**: ✅ Uses window.spark.llm for content analysis, routing logic based on user role and question type, queue state tracking in window.spark.kv

### Commitment Hierarchy
- **Functionality**: Enforces Sarah → Market → Users → BMAD validation → Marcus flow where engineers commit last on validated requirements
- **Purpose**: Requirements firewall protecting engineers from ambiguous goals, scope churn, and mid-flight pivots
- **Trigger**: Decision moves through workflow stages
- **Progression**: Sarah proposes → AI validates against market/users → BMAD checks alignment → Creates requirement PR → Marcus reviews non-ambiguous spec → Approves/Overrides → Work begins on stable foundation
- **Success criteria**: No engineering work starts on unvalidated requirements, all specs include who/what/success/out-of-scope, engineers can trace decision provenance, rework reduced by >50%
- **Backend Integration**: ✅ Workflow state machine in window.spark.kv, AI validation via window.spark.llm, Git storage in .bmad/ directory structure

### User Authentication System
- **Functionality**: Secure sign-up and sign-in flows with email/password authentication, role selection during registration, and persistent session management
- **Purpose**: Ensure secure access to the platform while allowing users to identify their role (technical/business) for tailored experiences
- **Trigger**: User opens app without an active session
- **Progression**: User opens app → Authentication form displays → User selects Sign In or Sign Up tab → For sign up: enters name, email, password, selects role (business/technical) → For sign in: enters email and password → Credentials validated → User session created → User redirected to main app interface
- **Success criteria**: Credentials persist across sessions, sign up prevents duplicate emails, sign in validates credentials correctly, role selection works during registration, sign out clears session, loading states handle auth checks gracefully
- **Backend Integration**: ✅ Uses window.spark.kv to store user credentials and current session, custom auth service manages sign up/sign in/sign out operations

### Hierarchical Chat Organization
- **Functionality**: Chats organized in a three-level hierarchy (Domain → Service → Feature) with collapsible tree navigation and smart filtering
- **Purpose**: Scale documentation conversations across large organizations by providing clear structure and easy navigation through related topics
- **Trigger**: User creates new chat or browses chat list
- **Progression**: User clicks New Chat → Dialog opens with Domain/Service/Feature dropdowns → Each dropdown shows existing options plus "Create New" → User selects or creates at each level → Enters chat title → Chat created in hierarchy → Chat list displays collapsible tree structure → User expands/collapses domains/services/features → Badges show chat counts at each level
- **Success criteria**: Chats grouped correctly by Domain/Service/Feature, collapsible tree navigation works smoothly, existing options populate dropdowns, new categories can be created inline, chat counts display accurately, hierarchy persists across sessions, mobile-friendly navigation
- **Backend Integration**: ✅ Extended Chat type with domain/service/feature fields, persisted in window.spark.kv, client-side organization logic in ChatList component

### Multi-User Chat Interface
- **Functionality**: Real-time chat interface powered by Spark LLM SDK (gpt-4o model) where multiple users can collaborate, see each other's presence, and have conversations that generate documentation
- **Purpose**: Creates a familiar, accessible interface for both technical and business users to collaborate through natural language with real-time awareness of other team members
- **Trigger**: User selects or creates a new chat session from the sidebar
- **Progression**: User opens app → Views chat list → Selects/creates chat → Sees active collaborators → Types message (others see typing indicator) → AI responds via Spark LLM → Documentation changes are proposed → User continues conversation or reviews changes → Real-time activity updates for all participants
- **Success criteria**: Messages send instantly, AI responses stream naturally via window.spark.llm, chat history persists across sessions using window.spark.kv, interface adapts to user type (technical/business), presence indicators show active users, typing indicators work in real-time
- **Backend Integration**: ✅ Uses window.spark.llm() with gpt-4o for AI responses, window.spark.kv for persistent storage and real-time presence tracking

### User Role Management
- **Functionality**: Differentiate between technical and business users with tailored experiences based on role selected during sign up
- **Purpose**: Optimize interface and suggestions based on user expertise level
- **Trigger**: User selects role during sign up process
- **Progression**: User signs up → Selects role (business/technical) with visual indicators → Role saved to profile → Interface adapts (technical users see more code details, business users see simplified views) → User interacts with appropriate context → Role badge displays in header
- **Success criteria**: Role badge displays clearly, interface elements adjust based on role, suggestions are contextually appropriate, role persists across sessions, visible in user profile
- **Backend Integration**: ✅ Role stored in AuthUser type in window.spark.kv, role badge displays in app header, affects AI prompt generation for translations

### Markdown File Change Tracking (.bmad/ Directory Structure)
- **Functionality**: Backend automatically generates/modifies markdown files in the .bmad/ directory based on chat conversations, displaying diffs in the UI. The .bmad/ directory serves as a living specification with structured decision tracking.
- **Purpose**: Transform conversational insights into structured documentation without manual file editing. Git becomes the requirements database with .bmad/ making spec = repo.
- **Trigger**: AI response contains actionable documentation updates
- **Progression**: Chat message sent → AI analyzes → Determines documentation impact → Generates markdown changes in .bmad/ structure → Shows diff in sidebar → User can preview/edit → Changes staged for PR
- **Success criteria**: File changes are accurate representations of conversation, diffs are clearly visible, multiple files can be changed in one conversation, .bmad/ directory maintains clear structure
- **Directory Structure**:
  - `.bmad/config.yaml` - Project configuration and metadata
  - `.bmad/status.yaml` - Current project status and milestone tracking
  - `.bmad/decisions/` - Approved architectural and business decisions
  - `.bmad/pending/` - Decisions awaiting review and approval
  - `.bmad/history/` - Archived decisions and decision evolution

### Integrated Pull Request Workflow
- **Functionality**: Complete PR creation, review, and merge process within the app interface with comprehensive file preview capabilities
- **Purpose**: Remove friction from documentation updates by keeping the entire workflow in one place with detailed before/after file comparisons
- **Trigger**: User clicks "Create PR" after reviewing staged changes
- **Progression**: Changes staged → User creates PR with title/description → User can preview individual files or all files at once → Multiple view modes (unified/split/before/after) → PR appears in PR list → Reviewers preview changes with full file context → Reviewers comment/approve → Changes merged or requested → Conversation continues
- **Success criteria**: PRs create successfully, file previews show accurate before/after states, unified and split view modes work correctly, review comments thread properly, merge operations work, PR status updates in real-time, preview navigation between files is seamless

### Persistent Chat History
- **Functionality**: All conversations are saved and searchable across sessions using Spark KV store
- **Purpose**: Build institutional knowledge and allow users to reference past discussions
- **Trigger**: Automatic on every message
- **Progression**: Message sent → Saved to window.spark.kv → Appears in chat list → User can search/filter → Select old chat → Full history loads → Can resume conversation
- **Success criteria**: No messages lost, chats load quickly, search finds relevant conversations, timestamps accurate
- **Backend Integration**: ✅ Uses useKV React hook for reactive state management, all chats and pull requests persist in KV store

### Real-Time Collaboration
- **Functionality**: Multi-user presence awareness with live indicators showing who's online, what they're viewing, and when they're typing. Activity feed displays recent collaboration events.
- **Purpose**: Enable seamless team coordination by providing visibility into other users' activities and fostering a sense of shared workspace
- **Trigger**: Automatic when users join the platform or switch between chats
- **Progression**: User logs in → Presence broadcast to all active users → User enters chat → Active users displayed in header → User types → Typing indicator shown to others → User sends message/creates PR → Activity logged and displayed to team → Continuous polling for updates every 2 seconds
- **Success criteria**: Presence updates within 2 seconds, typing indicators appear immediately, active user avatars display with pulsing animation, activity feed shows chronological events, stale presence cleaned up after 30 seconds of inactivity
- **Backend Integration**: ✅ Uses window.spark.kv for presence data and collaboration events storage, custom polling mechanism for real-time updates, collaborative service manages presence heartbeat every 5 seconds

### File Preview for Documentation Changes
- **Functionality**: Comprehensive file preview system showing full context of documentation changes with multiple view modes before merging PRs
- **Purpose**: Enable thorough review of changes with complete file context, reducing merge errors and improving review quality
- **Trigger**: User clicks preview button on individual file or "Preview All" for all files in a PR
- **Progression**: User reviewing changes → Clicks preview → Modal opens showing file content → User can toggle between unified view (inline diff), split view (side-by-side), before-only view, or after-only view → For multiple files, navigation arrows and file tabs allow switching between files → User reviews with full context → Closes preview and proceeds with PR workflow
- **Success criteria**: Previews open instantly, view modes switch smoothly, line numbers display correctly, syntax highlighting for markdown, additions/deletions clearly color-coded (green/red), navigation between multiple files works seamlessly, mobile-responsive layout adapts preview to smaller screens
- **Backend Integration**: ✅ Uses existing FileChange type from types.ts, operates on staged changes stored in component state

### Role-Based Content Translation
- **Functionality**: AI-powered translation system that adapts documentation and messages to the user's role (technical or business), providing contextual explanations via interactive tooltips and simplified language
- **Purpose**: Bridge communication gaps between technical and business users by making complex technical content accessible to business users and providing implementation details to technical users
- **Trigger**: User clicks "Translate for [Role]" button on AI messages or file changes
- **Progression**: User views message/document → Clicks translate button for their role → AI analyzes content via window.spark.llm → Identifies terms/concepts needing explanation → Segments are underlined with info icons → User hovers over segments → Tooltip shows explanation, context, and optionally simplified text → User understands content in their context
- **Success criteria**: Translations appear within 3 seconds, tooltips are informative and role-appropriate, technical jargon explained for business users, business implications detailed for technical users, translations persist with messages, multiple segments can be highlighted simultaneously, mobile-friendly tooltip interactions
- **Backend Integration**: ✅ Uses window.spark.llm() with gpt-4o for intelligent content analysis, translations stored in message objects with useKV persistence, role-specific prompting based on window.spark.user() role

## Edge Case Handling

- **Authentication Failures**: Display clear error messages for invalid credentials, prevent duplicate email registrations, handle missing fields gracefully
- **Session Persistence**: Auto-load user session on app start, handle expired sessions gracefully, provide sign out option in header
- **Empty Organization**: When no chats exist, guide user to create first chat with domain/service/feature structure
- **Deep Hierarchy Navigation**: Handle deeply nested chat structures efficiently, maintain scroll position when expanding/collapsing
- **Duplicate Category Names**: Allow same service/feature names under different parents (e.g., "API" service in multiple domains)
- **Concurrent Edits**: When multiple users modify the same markdown file simultaneously, show merge conflict indicators and allow manual resolution
- **AI Service Outage**: Display graceful error messages, queue messages for retry, allow manual markdown editing as fallback
- **Large Markdown Files**: Implement pagination/lazy loading for diffs, show summary of changes before full diff
- **Network Interruptions**: Optimistic UI updates with retry logic, clearly indicate pending/failed messages, presence system auto-recovers on reconnection
- **Empty States**: Dashboard shows welcoming onboarding for first-time users with clear next actions, momentum metrics show zero state gracefully, empty queues trigger cross-pollination suggestions
- **Stalled Projects**: Dashboard detects low velocity (<0.5 decisions/hour for 48h) and offers intervention: "Get Help", "Schedule Sync", or "AI Suggest Next Steps"
- **Routing Errors**: When question is misrouted (technical to business or vice versa), show gentle notification suggesting appropriate collaborator
- **Queue Blocking**: When user's queue is blocked (awaiting dependencies), automatically surface cross-pollination opportunities from other domain
- **Permission Issues**: Graceful handling when user lacks merge permissions, request access flows
- **Stale Presence Data**: Automatic cleanup of user presence after 30 seconds of inactivity to prevent ghost users in collaboration indicators
- **Race Conditions**: Proper state management using functional updates to prevent data loss when multiple events occur simultaneously
- **Presence Polling Failures**: Service continues to attempt reconnection, users remain visible with last known state until timeout
- **Empty File Changes**: Preview dialogs gracefully handle files with no additions or deletions, showing appropriate empty state messages
- **Single File Navigation**: Preview navigation UI adapts when only one file is present, hiding unnecessary navigation controls
- **Translation Failures**: If AI translation fails, show error toast and allow retry; if no terms need translation, inform user gracefully
- **Overlapping Translations**: If user requests translation multiple times, prevent duplicate work and inform of existing translation
- **Long Document Translation**: Limit translation to most important 5-10 terms to keep response time reasonable and avoid overwhelming users

## Design Direction

The design should evoke **momentum and confidence** - a professional workspace optimized for forward motion where projects never stall. The interface communicates progress as a living narrative, with velocity indicators and next-action clarity front and center. Visual hierarchy emphasizes trajectory over static state: "Where are we going?" trumps "Where are we?". The dashboard feels like a mission control center - not overwhelming with data, but crystal clear on current momentum, next action, and project health. Complex AI orchestration, intelligent routing, and Git integration happen invisibly, surfacing only as helpful nudges and routing suggestions. The experience should feel like having a smart project manager who knows exactly what you need to focus on next.

## Color Selection

A professional, trustworthy palette that balances technical precision with business approachability. The color scheme uses deep blues for authority and warm accents for interactive moments.

- **Primary Color**: Deep Navy Blue (oklch(0.35 0.08 250)) - Communicates technical professionalism and trust, used for primary actions and headers
- **Secondary Colors**: Slate Gray (oklch(0.65 0.015 250)) for secondary UI elements and neutral backgrounds, providing sophisticated contrast without competing with primary
- **Accent Color**: Electric Cyan (oklch(0.75 0.15 210)) - Draws attention to active chat messages, AI responses, and CTA buttons, creates energy and modernity
- **Foreground/Background Pairings**: 
  - Primary Navy (oklch(0.35 0.08 250)): White text (oklch(0.98 0 0)) - Ratio 8.2:1 ✓
  - Accent Cyan (oklch(0.75 0.15 210)): Navy text (oklch(0.25 0.08 250)) - Ratio 5.9:1 ✓
  - Background Light (oklch(0.98 0 0)): Foreground Dark (oklch(0.25 0.02 250)) - Ratio 12.3:1 ✓
  - Muted Slate (oklch(0.93 0.01 250)): Muted text (oklch(0.50 0.02 250)) - Ratio 5.1:1 ✓

## Font Selection

The typography should bridge technical precision and business readability, using a modern sans-serif that feels contemporary yet professional.

- **Primary Font**: Space Grotesk - A geometric sans with technical character that remains highly readable, perfect for bridging technical and business audiences
- **Secondary Font**: JetBrains Mono - For code blocks, diffs, and technical content, maintaining clarity in monospace contexts

**Typographic Hierarchy**:
- H1 (App Title/Page Headers): Space Grotesk Bold / 32px / -0.02em letter spacing / 1.2 line height
- H2 (Chat Titles, PR Titles): Space Grotesk Semibold / 20px / -0.01em letter spacing / 1.3 line height
- Body (Chat Messages): Space Grotesk Regular / 15px / normal letter spacing / 1.6 line height
- Small (Timestamps, Metadata): Space Grotesk Medium / 13px / normal letter spacing / 1.4 line height
- Code (Diffs, Files): JetBrains Mono Regular / 14px / normal letter spacing / 1.5 line height

## Animations

## Animations

Animations should reinforce momentum, progress, and forward motion. The dashboard entrance uses staggered animations (framer-motion) to reveal trajectory story, then metrics, then next action - building narrative momentum. Velocity trend indicators (up/down arrows) pulse subtly when showing positive momentum. Progress bars fill smoothly with spring physics (300ms) celebrating each milestone. Message send/receive has gentle fade-in with upward motion (200ms ease-out). AI typing indicators pulse smoothly. Next action cards scale up gently (1.02x) on hover, inviting interaction. Presence indicators feature continuous subtle pulsing for active status. PR status transitions use fluid color morphing (300ms). Dashboard re-entries fade smoothly (400ms) to maintain spatial consistency. Momentum metrics update with satisfying number counting animations. Empty state illustrations breathe gently to feel alive, not static. Avoid aggressive animations that create anxiety about velocity - every motion should feel confident and purposeful, reinforcing that the project is moving forward.

## Component Selection

**Components**:
- **Momentum Dashboard**: Custom dashboard component with progress narrative, velocity metrics (decisions/hour), trend indicators, next action card with urgency badges, stage progress bar
- **Authentication Form**: Custom full-screen auth component with tabbed interface (sign in/sign up), email/password inputs with icons, role selection emphasizing Sarah (Business) vs Marcus (Technical) personas
- **New Decision Thread Dialog**: Modal dialog with cascading dropdowns for Domain/Service/Feature selection, inline creation of new categories, decision-focused language
- **Sidebar**: Custom collapsible sidebar with hierarchical tree navigation for chats (shadcn Collapsible component for expand/collapse)
- **ScrollArea**: For chat message history, file diff viewing, hierarchical chat list, and dashboard content
- **Avatar**: User profile pictures with role badges (technical/business), also used for presence indicators with pulsing active status
- **Card**: Dashboard metric cards, PR cards, file change preview cards, authentication card container, next action card with urgency styling
- **Progress**: Linear progress bar for stage completion, velocity tracking
- **Dialog**: PR creation modal, merge confirmation dialogs, file preview modals with multi-view support, document translation viewer, new decision thread dialog
- **Textarea**: Chat message input with auto-resize and typing detection
- **Button**: Primary (send message, create PR, next action CTAs), Secondary (skip, alternate paths), Destructive (close PR), Ghost (navigate home)
- **Badge**: Role indicators (Sarah/Marcus), PR status, urgency indicators (high/medium/low), stage badges, file change counts, momentum trend badges
- **Separator**: Visual breaks between chat sections and PR items
- **Tabs**: Switch between "Active Chats", "PR Queue", "Merged History", and "Activity Feed"; also used for view mode switching in file preview, and for Sign In/Sign Up
- **Accordion**: Expandable file diffs within PR view
- **Alert**: System notifications for merge conflicts, AI errors, authentication errors
- **Tooltip**: Display user names and status on hover of presence avatars, show translation explanations on hover of underlined terms
- **Sheet**: Mobile drawer navigation for chat list, changes panel, and activity feed
- **Collapsible**: Hierarchical chat organization with expand/collapse for domains, services, and features
- **Select**: Dropdown menus for Domain/Service/Feature selection in new chat dialog
- **RadioGroup**: Role selection during sign up (Business/Technical)
- **Input**: Text inputs for authentication (email, password, name), chat title, category names

**Customizations**:
- **Auth Form**: Full-screen gradient background with centered card, tabbed interface switching between sign in and sign up, visual role selection with icons and descriptions
- **Hierarchical Chat List**: Multi-level collapsible tree with folder icons, caret indicators, and badges showing counts at each level
- **Organization Dialog**: Smart dropdown system that shows existing options and allows inline creation of new categories
- **Message Bubbles**: Custom component with user/AI differentiation (user messages aligned right with accent background, AI messages left with muted background), with translation button for AI messages
- **Diff Viewer**: Syntax-highlighted markdown diff component showing additions/deletions with line numbers
- **File Preview Dialog**: Full-screen modal with multiple view modes (unified, split, before-only, after-only), line numbers, color-coded changes, navigation between files
- **All Files Preview**: Multi-file preview with file navigation arrows, quick file selector tabs, and persistent view mode selection across files
- **PR Timeline**: Custom component showing comment threads, approvals, and status changes chronologically
- **Active Users Widget**: Overlapping avatar stack with pulsing presence indicators, hover tooltips showing user names and typing status
- **Typing Indicator**: Animated dots with user avatars showing who is currently typing
- **Activity Feed**: Chronological event list with icons and timestamps showing collaboration events (joins, messages, PR activity)
- **Translation Tooltips**: Interactive tooltips showing term explanations, context, and simplified text with accent-colored underlines and info icons
- **Document Translation View**: Full-screen translation modal for file changes with line-by-line explanations, role-specific views, and persistent translation state

**States**:
- Buttons: Hover shows slight scale (1.02) and brightness increase, active state scales down (0.98), disabled has 50% opacity with no-drop cursor, loading shows spinner
- Inputs: Focus shows accent-colored ring with subtle glow, error state shows red ring with shake animation, disabled shows muted appearance
- Messages: Sending shows opacity 0.6 with loading spinner, sent has full opacity, failed has red border with retry button
- Auth form: Loading state during sign in/sign up shows disabled inputs and button spinner

**Icon Selection**:
- Authentication: Lock (password), EnvelopeSimple (email), User (name), SignOut (logout)
- Organization: Folder/FolderOpen (categories), CaretRight/CaretDown (expand/collapse)
- Chat/conversation: ChatCircle, ChatsTeardrop
- Send message: PaperPlaneRight
- PR actions: GitPullRequest, GitMerge, GitBranch
- User roles: User, UserGear (technical), Briefcase (business)
- Collaboration: UserPlus (join), UserMinus (leave), PencilSimple (typing), Circle (online status)
- Activity: ChartLine (activity feed), CheckCircle (approved), XCircle (rejected), Clock (pending)
- File operations: File, FileText, FileDotted (pending changes)
- Preview actions: Eye (view/preview), SplitVertical (split view), CaretLeft/CaretRight (navigation)
- Translation: Translate (translate trigger), Info (tooltip indicators for explanations)
- Navigation: List, CaretLeft/Right, MagnifyingGlass, Plus (new chat)

**Spacing**:
- Container padding: p-6 (24px) for main content areas
- Card padding: p-4 (16px) for internal card content, p-3 (12px) for hierarchy items
- Message spacing: gap-3 (12px) between consecutive messages, gap-6 (24px) between message groups
- Section margins: mb-8 (32px) between major sections
- Button padding: px-4 py-2 (16px horizontal, 8px vertical) for standard buttons
- Auth form: max-w-md for card, space-y-4 for form fields

**Mobile**:
- ✅ Authentication form fully responsive with proper input sizing for mobile
- ✅ New chat dialog adapts to mobile screen with full-width dropdowns
- ✅ Sidebar collapses to Sheet drawer overlay on mobile (<768px)
- ✅ Hierarchical navigation works with touch gestures for expand/collapse
- ✅ Right panel (Changes/PRs/Activity) accessible via floating action button with Sheet drawer on mobile
- ✅ Responsive header with adaptive sizing and hidden elements on small screens
- ✅ Active users widget shows fewer avatars on mobile (3 vs 5 on desktop)
- ✅ Message bubbles scale appropriately (85% max-width on mobile, 75% on desktop)
- ✅ Touch-optimized input areas with appropriate sizing (50px on mobile, 60px on desktop)
- ✅ Floating action button for Changes/PRs/Activity access on mobile
- ✅ Dialogs (PR details, Create PR, New Chat) adapt to mobile screen sizes
- ✅ Responsive typography: reduced font sizes and spacing on mobile
- ✅ Single column layout on mobile with drawer-based navigation
- ✅ Avatar and badge sizing adapts to screen size
- ✅ Auto-close drawers after selection on mobile for better UX
- ✅ Typing indicators and presence widgets fully responsive
- ✅ Activity feed optimized for mobile with touch-friendly event cards
- ✅ Sign out button accessible on mobile header
