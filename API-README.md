# BMAD Backend API Specification

This directory contains the OpenAPI 3.1 specification for the BMAD (Business Model Architecture Design) Platform backend API.

## Overview

The BMAD backend API provides endpoints for a momentum-first collaboration platform that bridges technical and business co-founders through:

- **Intelligent Question Routing**: AI directs questions to the appropriate role
- **Git-Based Documentation**: All decisions stored in `.bmad/` directory structure
- **Async Collaboration**: Non-blocking workflows with provisional commits
- **Pull Request Workflow**: Documentation changes reviewed through in-app PR interface
- **Real-Time Presence**: Active users, typing indicators, and activity feeds
- **Role-Based Translation**: AI translates technical/business terminology for each role

## Files

- `openapi.yaml` - Complete OpenAPI 3.1 specification

## Key API Endpoints

### Authentication & Users
- `POST /auth/signup` - Create new account
- `POST /auth/signin` - Authenticate user
- `POST /auth/signout` - End session
- `GET /auth/me` - Get current user
- `PUT /users/{userId}/presence` - Update presence

### Chats & Messages
- `GET /chats` - List all chats
- `POST /chats` - Create new chat (organized by Domain/Service/Feature)
- `GET /chats/{chatId}` - Get chat with messages
- `POST /chats/{chatId}/messages` - Send message (AI responds with suggestions)
- `POST /chats/{chatId}/messages/{messageId}/translate` - Translate for user role

### Pull Requests
- `GET /pull-requests` - List PRs with filtering
- `POST /pull-requests` - Create PR from pending changes
- `GET /pull-requests/{prId}` - Get PR details
- `POST /pull-requests/{prId}/merge` - Merge PR to Git
- `POST /pull-requests/{prId}/approve` - Add approval
- `POST /pull-requests/{prId}/comments` - Add comment

### File Changes & Comments
- `POST /pull-requests/{prId}/files/{fileId}/comments` - Add line comment
- `POST /pull-requests/{prId}/line-comments/{commentId}/resolve` - Resolve comment
- `POST /pull-requests/{prId}/line-comments/{commentId}/reactions/toggle` - Toggle emoji reaction

### Collaboration
- `GET /presence` - Get active users
- `GET /collaboration-events` - Get recent events (messages, PRs, decisions, etc.)
- `POST /collaboration-events` - Broadcast event

### Decision Center
- `GET /decisions` - List decisions for a chat
- `POST /decisions` - Create a decision
- `PATCH /decisions/{decisionId}` - Update title/value
- `POST /decisions/{decisionId}/lock` - Lock decision
- `POST /decisions/{decisionId}/unlock` - Unlock decision
- `GET /decisions/{decisionId}/history` - Get version history
- `GET /decisions/{decisionId}/conflicts` - Get conflict list
- `POST /decisions/{decisionId}/conflicts/{conflictId}/resolve` - Resolve conflict

### Organization
- `GET /organization/domains` - List domains
- `GET /organization/services` - List services
- `GET /organization/features` - List features

### AI Features
- `POST /ai/defaults` - Generate AI-suggested defaults for decisions

## Core Data Models

### User
```json
{
  "id": "user-1705712345678",
  "email": "sarah@example.com",
  "name": "Sarah Chen",
  "role": "business",
  "avatarUrl": "https://api.dicebear.com/7.x/initials/svg?seed=Sarah%20Chen"
}
```

### Chat
```json
{
  "id": "chat-1705712345678",
  "title": "User Authentication Flow",
  "domain": "Identity Management",
  "service": "Authentication Service",
  "feature": "OAuth Integration",
  "messages": [...],
  "participants": ["user-1", "user-2"]
}
```

### Message
```json
{
  "id": "msg-1705712345678",
  "chatId": "chat-1705712345678",
  "content": "We should implement OAuth 2.0",
  "role": "user",
  "timestamp": 1705712345678,
  "userId": "user-1705712345678",
  "fileChanges": [...],
  "translations": [...]
}
```

### FileChange
```json
{
  "path": ".bmad/decisions/auth-strategy.md",
  "additions": [
    "# Decision: Authentication Strategy",
    "**Status:** Approved",
    "We will use OAuth 2.0 for user authentication."
  ],
  "deletions": [],
  "status": "pending",
  "lineComments": [...]
}
```

### PullRequest
```json
{
  "id": "pr-1705712345678",
  "title": "Add authentication decision document",
  "description": "Documents the decision to use OAuth 2.0",
  "author": "Sarah Chen",
  "status": "open",
  "fileChanges": [...],
  "comments": [...],
  "approvals": ["user-2"]
}
```

## Authentication

The API supports two authentication methods:

1. **Bearer Token (JWT)**: Include in `Authorization` header
   ```
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

2. **Session Cookie**: Set by server on signin
   ```
   Cookie: session=abc123...
   ```

All endpoints except `/auth/signup`, `/auth/signin`, and `/health` require authentication.

## Role-Based Behavior

### Business Users
- AI responses focus on business impact, user benefits, outcomes
- Plain language explanations without technical jargon
- "Accept for Now" patterns to prevent analysis paralysis
- Momentum-first dashboard showing trajectory and next actions

### Technical Users
- AI responses include implementation details and architecture
- Non-ambiguous requirements (who/what/success/out-of-scope)
- Technical feasibility and integration points
- Decision traceability and blast radius analysis

## Workflow Patterns

### 1. Creating a Chat and Sending Messages
```
POST /chats
  â†’ Create chat with Domain/Service/Feature

POST /chats/{chatId}/messages
  â†’ AI processes message and responds with:
     - Conversational response appropriate for user role
     - Suggested file changes in .bmad/ directory
     - Routing assessment
     - Momentum indicator
```

### 2. Creating a Pull Request
```
POST /pull-requests
  â†’ Create PR from pending file changes
  â†’ Status: "open"

POST /pull-requests/{prId}/comments
  â†’ Add review comments

POST /pull-requests/{prId}/files/{fileId}/comments
  â†’ Add line-level comments on specific changes

POST /pull-requests/{prId}/approve
  â†’ Add approval

POST /pull-requests/{prId}/merge
  â†’ Merge changes to .bmad/ directory in Git
  â†’ Status: "merged"
```

### 3. Real-Time Collaboration
```
PUT /users/{userId}/presence
  â†’ Update presence (activeChat, isTyping)

GET /presence
  â†’ Poll for active users

GET /collaboration-events?since={timestamp}
  â†’ Poll for recent events
```

### 4. Role Translation
```
POST /chats/{chatId}/messages/{messageId}/translate
  â†’ AI analyzes message and identifies segments needing explanation
  â†’ Returns annotated segments with:
     - Explanation appropriate for user's role
     - Context about why it matters
     - Optional simplified text
```

## Git Integration

The backend maintains a `.bmad/` directory structure in a Git repository:

```
.bmad/
â”œâ”€â”€ config.yaml          # Project configuration
â”œâ”€â”€ status.yaml          # Current project status
â”œâ”€â”€ decisions/           # Approved decisions
â”‚   â”œâ”€â”€ auth-strategy.md
â”‚   â””â”€â”€ ...
â”œâ”€â”€ pending/             # Decisions awaiting approval
â””â”€â”€ history/             # Decision history and audit trail
```

When a PR is merged via `POST /pull-requests/{prId}/merge`, the backend:
1. Applies file changes to the `.bmad/` directory
2. Creates a Git commit with PR details
3. Updates PR status to "merged"
4. Broadcasts collaboration event

## AI Features

### Message Processing
When a message is sent, the AI:
1. Determines user role (technical/business)
2. Generates role-appropriate response
3. Suggests relevant documentation changes
4. Assesses routing (is question appropriate for this user?)
5. Provides momentum indicator (high/medium/low)

### Role Translation
When translation is requested:
1. AI identifies technical terms, APIs, jargon
2. Provides clear explanations for the user's role
3. Gives context about larger project impact
4. Returns annotated segments with precise text positions

### AI Defaults (Provisional Commit)
When the appropriate user is unavailable:
1. AI generates suggested defaults
2. Provides confidence score and reasoning
3. Offers alternative options with pros/cons
4. Sets timeout for manual override

## Rate Limits

- **Authentication endpoints**: 10 requests/minute per IP
- **Message creation**: 60 requests/minute per user
- **Other endpoints**: 1000 requests/minute per user

## Error Handling

All error responses follow this format:

```json
{
  "error": "error_code",
  "message": "Human-readable error message",
  "details": {
    // Additional context
  }
}
```

Common error codes:
- `invalid_request` - Bad request (400)
- `unauthorized` - Authentication required (401)
- `forbidden` - Insufficient permissions (403)
- `not_found` - Resource not found (404)
- `conflict` - Resource conflict (409)
- `rate_limited` - Too many requests (429)
- `internal_error` - Server error (500)

## WebSocket Alternative

For production systems requiring true real-time updates, consider WebSocket endpoints:

- `ws://api.bmad.example.com/ws/presence` - Real-time presence updates
- `ws://api.bmad.example.com/ws/chats/{chatId}` - Real-time chat messages
- `ws://api.bmad.example.com/ws/events` - Real-time collaboration events

## Development

### Viewing the Spec
```bash
# Install Swagger UI
npm install -g swagger-ui-watcher

# Start viewer
swagger-ui-watcher openapi.yaml
```

### Validation
```bash
# Install OpenAPI validator
npm install -g @apidevtools/swagger-cli

# Validate spec
swagger-cli validate openapi.yaml
```

### Code Generation

Generate client SDKs using [OpenAPI Generator](https://openapi-generator.tech/):

```bash
# TypeScript/Axios client
openapi-generator-cli generate -i openapi.yaml -g typescript-axios -o ./sdk/typescript

# Python client
openapi-generator-cli generate -i openapi.yaml -g python -o ./sdk/python

# Go client
openapi-generator-cli generate -i openapi.yaml -g go -o ./sdk/go
```

## Implementation Notes

### Backend Requirements

1. **Database**: PostgreSQL or MongoDB for storing users, chats, messages, PRs
2. **Git Integration**: LibGit2 or equivalent for managing .bmad/ directory
3. **AI Integration**: OpenAI API or similar LLM service
4. **Caching**: Redis for presence data and recent events
5. **Queue**: Background job queue for AI processing (Bull, Celery, etc.)
6. **Search**: Elasticsearch for full-text search across chats and docs

### Security Considerations

1. **Password Hashing**: Use bcrypt, argon2, or similar
2. **JWT Secrets**: Rotate regularly, use strong random values
3. **Rate Limiting**: Implement per-user and per-IP limits
4. **Input Validation**: Sanitize all user input
5. **Git Access**: Ensure proper isolation between projects
6. **AI Prompts**: Validate and sanitize inputs to LLM

### Scalability

1. **Horizontal Scaling**: Stateless API servers behind load balancer
2. **Database**: Read replicas for presence/events queries
3. **Caching**: Cache frequently accessed chats and PRs
4. **AI Processing**: Async job queue to prevent blocking requests
5. **File Storage**: Consider S3/blob storage for large .bmad/ repos

## License

MIT License - See LICENSE file for details

