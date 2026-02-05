import { User, UserRole, TranslatedSegment } from '@/lib/types'

export interface AIResponse {
  response: string
  suggestedChanges?: any[]
  routingAssessment?: string
  momentumIndicator?: string
}

export interface TranslationResponse {
  segments: TranslatedSegment[]
}

export class AIService {
  static async generateChatResponse(
    content: string,
    currentUser: User
  ): Promise<AIResponse> {
    const roleGuidance = this.getRoleGuidance(currentUser.role)
    
    const promptText = `You are BMAD, an intelligent orchestrator for business model architecture design. Your role is to bridge technical and non-technical co-founders by:
1. Routing technical questions to technical users and business questions to business users
2. Protecting engineers from ambiguous requirements (Requirements Firewall)
3. Enforcing commitment hierarchy: Sarah (business) → Market → Users → BMAD validation → Marcus (technical)
4. Maintaining momentum - projects must always move forward

Current User: ${currentUser.name} (${currentUser.role} role)

User message: ${content}

Based on this conversation, generate:
1. A helpful response that respects their role and expertise level
2. Suggested markdown documentation changes in the .bmad/ directory structure (if applicable)
3. Assessment: Is this question properly routed to this user? (technical questions to technical users, business to business)

For ${currentUser.role} users, focus on:
${roleGuidance}

Respond in a conversational way that builds momentum. If the conversation suggests documentation updates, mention what files in .bmad/ should be updated.

Format your response as JSON with this structure:
{
  "response": "your conversational response here",
  "suggestedChanges": [
    {
      "path": ".bmad/decisions/example-decision.md",
      "additions": ["# Decision: Example", "**Status:** Pending", "Content here"],
      "deletions": [],
      "status": "pending"
    }
  ],
  "routingAssessment": "correctly routed",
  "momentumIndicator": "high"
}`

    const response = await window.spark.llm(promptText, 'gpt-4o', true)
    return JSON.parse(response)
  }

  static async translateMessage(
    content: string,
    currentUserRole: UserRole
  ): Promise<TranslationResponse> {
    const roleDescription = currentUserRole === 'business'
      ? 'a business user who needs plain language explanations without technical jargon'
      : 'a technical user who needs detailed implementation specifics and technical accuracy'

    const promptText = `You are a translator that helps ${roleDescription} understand documentation and technical content.

Analyze the following text and identify segments that need explanation for a ${currentUserRole} user:

"${content}"

For each technical term, API reference, code snippet, or jargon that needs explanation:
1. Identify the exact text that needs clarification
2. Provide a clear explanation appropriate for a ${currentUserRole} user
3. Give context about why it matters in the larger project

${currentUserRole === 'business' 
  ? 'Focus on business impact, user benefits, and outcomes. Avoid technical implementation details.' 
  : 'Focus on implementation details, APIs, architecture, and technical specifications.'}

Return a JSON object with this exact structure:
{
  "segments": [
    {
      "originalText": "the exact text from the message that needs explanation",
      "startIndex": 0,
      "endIndex": 10,
      "explanation": "clear explanation for ${currentUserRole} user",
      "context": "why this matters in the project",
      "simplifiedText": "optional simplified version (only if significantly clearer)"
    }
  ]
}

Important: 
- startIndex and endIndex must match the exact position in the original text
- Only include segments that genuinely need explanation for a ${currentUserRole} user
- If nothing needs explanation, return an empty segments array`

    const response = await window.spark.llm(promptText, 'gpt-4o', true)
    return JSON.parse(response)
  }

  private static getRoleGuidance(role: UserRole): string {
    return role === 'business' 
      ? '- Business impact, user benefits, and outcomes\n- Market validation and user needs\n- Clear next actions without technical jargon\n- "Accept for Now" patterns to prevent analysis paralysis' 
      : '- Implementation details and architecture\n- Non-ambiguous requirements with who/what/success/out-of-scope\n- Technical feasibility and integration points\n- Decision traceability and blast radius'
  }
}
