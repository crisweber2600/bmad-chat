# Planning Guide

A collaborative chat platform that bridges technical and business stakeholders through AI-assisted conversations, automatically generating markdown documentation and managing pull request workflows entirely within the application interface.

**Experience Qualities**: 
1. **Conversational** - The interface should feel like a natural dialogue, removing technical barriers between business and technical users through intuitive chat interactions.
2. **Transparent** - Every change to documentation is visible and traceable, with clear PR workflows that demystify the review process for non-technical users.
3. **Efficient** - Rapid iteration cycles where conversations immediately generate actionable documentation changes, eliminating context-switching between tools.

**Complexity Level**: Complex Application (advanced functionality, likely with multiple views)
This application requires sophisticated state management across multiple chat sessions, real-time AI integration, file change tracking, PR workflow management, and role-based user experiences - all of which constitute an advanced multi-view application.

## Essential Features

### Multi-User Chat Interface
- **Functionality**: Real-time chat interface powered by Copilot SDK where users can have conversations that generate documentation
- **Purpose**: Creates a familiar, accessible interface for both technical and business users to collaborate through natural language
- **Trigger**: User selects or creates a new chat session from the sidebar
- **Progression**: User opens app → Views chat list → Selects/creates chat → Types message → AI responds → Documentation changes are proposed → User continues conversation or reviews changes
- **Success criteria**: Messages send instantly, AI responses stream naturally, chat history persists across sessions, interface adapts to user type (technical/business)

### User Role Management
- **Functionality**: Differentiate between technical and business users with tailored experiences
- **Purpose**: Optimize interface and suggestions based on user expertise level
- **Trigger**: User authentication on app load
- **Progression**: User logs in → Role is identified → Interface adapts (technical users see more code details, business users see simplified views) → User interacts with appropriate context
- **Success criteria**: Role badge displays clearly, interface elements adjust based on role, suggestions are contextually appropriate

### Markdown File Change Tracking
- **Functionality**: Backend automatically generates/modifies markdown files based on chat conversations, displaying diffs in the UI
- **Purpose**: Transform conversational insights into structured documentation without manual file editing
- **Trigger**: AI response contains actionable documentation updates
- **Progression**: Chat message sent → AI analyzes → Determines documentation impact → Generates markdown changes → Shows diff in sidebar → User can preview/edit → Changes staged for PR
- **Success criteria**: File changes are accurate representations of conversation, diffs are clearly visible, multiple files can be changed in one conversation

### Integrated Pull Request Workflow
- **Functionality**: Complete PR creation, review, and merge process within the app interface
- **Purpose**: Remove friction from documentation updates by keeping the entire workflow in one place
- **Trigger**: User clicks "Create PR" after reviewing staged changes
- **Progression**: Changes staged → User creates PR with title/description → PR appears in PR list → Reviewers comment/approve → Changes merged or requested → Conversation continues
- **Success criteria**: PRs create successfully, review comments thread properly, merge operations work, PR status updates in real-time

### Persistent Chat History
- **Functionality**: All conversations are saved and searchable across sessions
- **Purpose**: Build institutional knowledge and allow users to reference past discussions
- **Trigger**: Automatic on every message
- **Progression**: Message sent → Saved to KV store → Appears in chat list → User can search/filter → Select old chat → Full history loads → Can resume conversation
- **Success criteria**: No messages lost, chats load quickly, search finds relevant conversations, timestamps accurate

## Edge Case Handling

- **Concurrent Edits**: When multiple users modify the same markdown file simultaneously, show merge conflict indicators and allow manual resolution
- **AI Service Outage**: Display graceful error messages, queue messages for retry, allow manual markdown editing as fallback
- **Large Markdown Files**: Implement pagination/lazy loading for diffs, show summary of changes before full diff
- **Network Interruptions**: Optimistic UI updates with retry logic, clearly indicate pending/failed messages
- **Empty States**: Welcoming onboarding for first chat, helpful prompts when no PRs exist, clear guidance for new users
- **Permission Issues**: Graceful handling when user lacks merge permissions, request access flows

## Design Direction

The design should evoke **confidence and clarity** - a professional workspace that feels equally comfortable for developers and business stakeholders. The interface should communicate that complex processes (AI, Git, PRs) are happening behind the scenes, but the experience remains approachable and human-centered. Visual hierarchy should clearly separate conversation from documentation changes, making the "what's being discussed" versus "what's being changed" distinction immediately obvious.

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

Animations should reinforce the conversational flow and document change tracking. Use subtle transitions to guide attention: message send/receive should have gentle fade-in with slight upward motion (200ms ease-out), AI typing indicators should pulse smoothly, PR status changes should transition colors fluidly (300ms), and diff panels should slide open gracefully (250ms ease-in-out). Avoid aggressive animations that distract from content - every motion should feel purposeful and natural, like watching a real conversation unfold.

## Component Selection

**Components**:
- **Sidebar**: Custom collapsible sidebar for chat list and PR queue (shadcn Sidebar component as base)
- **ScrollArea**: For chat message history and file diff viewing
- **Avatar**: User profile pictures with role badges (technical/business)
- **Card**: PR cards, file change preview cards
- **Dialog**: PR creation modal, merge confirmation dialogs
- **Textarea**: Chat message input with auto-resize
- **Button**: Primary (send message, create PR), Secondary (cancel, view details), Destructive (close PR)
- **Badge**: Role indicators, PR status, file change counts
- **Separator**: Visual breaks between chat sections and PR items
- **Tabs**: Switch between "Active Chats", "PR Queue", "Merged History"
- **Accordion**: Expandable file diffs within PR view
- **Alert**: System notifications for merge conflicts, AI errors

**Customizations**:
- **Message Bubbles**: Custom component with user/AI differentiation (user messages aligned right with accent background, AI messages left with muted background)
- **Diff Viewer**: Syntax-highlighted markdown diff component showing additions/deletions with line numbers
- **PR Timeline**: Custom component showing comment threads, approvals, and status changes chronologically

**States**:
- Buttons: Hover shows slight scale (1.02) and brightness increase, active state scales down (0.98), disabled has 50% opacity with no-drop cursor
- Inputs: Focus shows accent-colored ring with subtle glow, error state shows red ring with shake animation
- Messages: Sending shows opacity 0.6 with loading spinner, sent has full opacity, failed has red border with retry button

**Icon Selection**:
- Chat/conversation: ChatCircle, ChatsTeardrop
- Send message: PaperPlaneRight
- PR actions: GitPullRequest, GitMerge, GitBranch
- User roles: User, UserGear (technical), Briefcase (business)
- File operations: File, FileText, FileDotted (pending changes)
- Navigation: List, CaretLeft/Right, MagnifyingGlass
- Status: CheckCircle (approved), XCircle (rejected), Clock (pending)

**Spacing**:
- Container padding: p-6 (24px) for main content areas
- Card padding: p-4 (16px) for internal card content
- Message spacing: gap-3 (12px) between consecutive messages, gap-6 (24px) between message groups
- Section margins: mb-8 (32px) between major sections
- Button padding: px-4 py-2 (16px horizontal, 8px vertical) for standard buttons

**Mobile**:
- Sidebar collapses to drawer overlay on <768px
- Two-column layout (chat + changes) stacks vertically on mobile
- Message bubbles maintain full width with appropriate padding
- PR cards stack in single column
- Bottom sheet for PR details instead of side panel
- Floating action button for new chat on mobile
- Reduced font sizes: Body 14px, Headers scale down proportionally
