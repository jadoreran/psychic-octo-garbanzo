/**
 * OpenAI API Service
 * Handles all communication with OpenAI API using official SDK
 */

import OpenAI from 'openai'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

class OpenAIService {
  private client: OpenAI | null = null
  private defaultModel: string = 'gpt-5-nano-2025-08-07'

  private initialize() {
    if (this.client) return // Already initialized

    const config = useRuntimeConfig()
    const apiKey = config.public.OPENAI_API_KEY as string
    const orgId = config.public.OPENAI_ORG_ID as string
    this.defaultModel = (config.public.OPENAI_MODEL as string) || 'gpt-5-nano-2025-08-07'

    if (!apiKey || apiKey === 'your_openai_api_key_here') {
      console.error('OpenAI API key is not configured. Please set NUXT_PUBLIC_OPENAI_API_KEY in .env')
    }

    this.client = new OpenAI({
      apiKey,
      organization: orgId || undefined,
      dangerouslyAllowBrowser: true // Required for client-side usage
    })
  }

  private getClient(): OpenAI {
    if (!this.client) {
      this.initialize()
    }
    return this.client!
  }

  /**
   * Check if model uses new parameter format (max_completion_tokens)
   *
   * OpenAI API Parameter Changes:
   * - Newer models use 'max_completion_tokens' instead of 'max_tokens'
   * - Affected models: gpt-4o, gpt-4-turbo, gpt-5 (all variants including nano), o1, o3
   * - Using 'max_tokens' with these models results in: 400 Unsupported parameter
   *
   * CRITICAL: GPT-5/o-series Reasoning Tokens & Empty Responses
   * - These models use internal reasoning tokens that count toward max_completion_tokens
   * - The limit includes BOTH reasoning tokens AND visible output
   * - If all tokens are used for reasoning, content will be empty with finish_reason: "length"
   * - Example: max_completion_tokens=800 might use all 800 for reasoning, returning empty content
   *
   * SOLUTION: Set reasoning_effort to 'low'
   * - GPT-5 nano/mini default reasoning can consume hundreds of tokens before producing output
   * - Setting reasoning_effort='low' prevents the model from using all tokens for reasoning
   * - This is REQUIRED for simple prompts (customer service, chat, etc.)
   * - Without it, you'll get empty responses even with high token limits
   *
   * References:
   * - https://community.openai.com/t/what-is-going-on-with-the-gpt-5-api/1338030
   * - https://learn.microsoft.com/en-us/answers/questions/5590694/ai-foundry-model-gpt-5-nano-returns-empty-response
   * - https://github.com/BerriAI/litellm/issues/13381
   */
  private usesNewTokenParam(model: string): boolean {
    return model.includes('gpt-4o') ||
           model.includes('gpt-4-turbo') ||
           model.includes('gpt-5') ||  // Includes gpt-5-nano, gpt-5-mini, gpt-5-chat
           model.includes('o1') ||
           model.includes('o3')
  }

  /**
   * Check if model supports custom temperature values
   *
   * Temperature Restrictions:
   * - Reasoning models (o1, o3, o4) and GPT-5 series only support temperature=1 (default)
   * - Using custom values (e.g. 0.7, 0.2) results in: 400 Unsupported value
   * - Other sampling parameters (top_p, presence_penalty, frequency_penalty) also unsupported
   * - Best practice: Omit temperature parameter entirely for these models
   *
   * References:
   * - https://community.openai.com/t/gpt-5-models-temperature/1337957
   * - Official OpenAI docs (as of 2025)
   */
  private supportsCustomTemperature(model: string): boolean {
    return !model.includes('o1') &&
           !model.includes('o3') &&
           !model.includes('o4') &&
           !model.includes('gpt-5')  // All gpt-5 variants: nano, mini, chat, etc.
  }

  /**
   * Send a chat completion request to OpenAI
   */
  async sendChatCompletion(
    messages: ChatMessage[],
    options: {
      model?: string
      temperature?: number
      max_tokens?: number
    } = {}
  ) {
    const {
      model = this.defaultModel,
      temperature = 0.7,
      max_tokens = 500
    } = options

    try {
      const params: any = {
        model,
        messages
      }

      // Only include temperature if the model supports it
      if (this.supportsCustomTemperature(model)) {
        params.temperature = temperature
      }

      // GPT-5 and o-series: Set reasoning_effort to 'low' to prevent empty responses
      // Without this, the model uses all tokens for reasoning and returns empty content
      if (model.includes('gpt-5') || model.includes('o1') || model.includes('o3') || model.includes('o4')) {
        params.reasoning_effort = 'low'
      }

      // Use the appropriate parameter based on model
      if (this.usesNewTokenParam(model)) {
        params.max_completion_tokens = max_tokens
      } else {
        params.max_tokens = max_tokens
      }

      const response = await this.getClient().chat.completions.create(params)

      return response
    } catch (error) {
      console.error('OpenAI API Error:', error)
      throw error
    }
  }

  /**
   * Generate a customer service response based on conversation context
   */
  async generateCustomerServiceResponse(
    conversationHistory: Array<{ user: string; text: string; isUser: boolean }>,
    systemPrompt?: string
  ): Promise<string> {
    const defaultSystemPrompt = `You are a helpful and friendly Thai customer service representative.
Your responses should be:
- Polite and professional in Thai language
- Concise and helpful
- Focused on solving customer problems
- Use appropriate Thai honorifics (ค่ะ/ครับ)

Keep responses brief and to the point.`

    // Convert conversation history to OpenAI format
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: systemPrompt || defaultSystemPrompt
      },
      ...conversationHistory.map(msg => ({
        role: msg.isUser ? 'assistant' as const : 'user' as const,
        content: msg.text
      }))
    ]

    const response = await this.sendChatCompletion(messages, {
      temperature: 0.7,
      max_tokens: 800  // Increased for GPT-5: reasoning tokens + visible output
    })

    return response.choices[0]?.message?.content || ''
  }

  /**
   * Stream chat completion (for real-time responses)
   */
  async *streamChatCompletion(
    messages: ChatMessage[],
    options: {
      model?: string
      temperature?: number
      max_tokens?: number
    } = {}
  ): AsyncGenerator<string, void, unknown> {
    const {
      model = this.defaultModel,
      temperature = 0.7,
      max_tokens = 500
    } = options

    try {
      const params: any = {
        model,
        messages,
        stream: true
      }

      // Only include temperature if the model supports it
      if (this.supportsCustomTemperature(model)) {
        params.temperature = temperature
      }

      // GPT-5 and o-series: Set reasoning_effort to 'low' to prevent empty responses
      // Without this, the model uses all tokens for reasoning and returns empty content
      if (model.includes('gpt-5') || model.includes('o1') || model.includes('o3') || model.includes('o4')) {
        params.reasoning_effort = 'low'
      }

      // Use the appropriate parameter based on model
      if (this.usesNewTokenParam(model)) {
        params.max_completion_tokens = max_tokens
      } else {
        params.max_tokens = max_tokens
      }

      const stream = await this.getClient().chat.completions.create(params)

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content
        if (content) {
          yield content
        }
      }
    } catch (error) {
      console.error('OpenAI Streaming Error:', error)
      throw error
    }
  }
}

// Export singleton instance
export const openAIService = new OpenAIService()
