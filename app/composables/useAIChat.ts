/**
 * Composable for AI-powered chat functionality
 * Manages AI responses, loading states, and conversation context
 */

import { openAIService } from '~/services/openai.service'

export interface Message {
  user: string
  text: string
  time: string
  isUser: boolean
  isAI?: boolean
  isStreaming?: boolean
}

export const useAIChat = () => {
  const isAIResponding = ref(false)
  const aiError = ref<string | null>(null)

  /**
   * Generate AI response based on conversation history
   */
  const generateAIResponse = async (
    messages: Message[],
    customSystemPrompt?: string
  ): Promise<string> => {
    isAIResponding.value = true
    aiError.value = null

    try {
      const response = await openAIService.generateCustomerServiceResponse(
        messages,
        customSystemPrompt
      )
      return response
    } catch (error) {
      console.error('Error generating AI response:', error)
      aiError.value = error instanceof Error ? error.message : 'Failed to generate AI response'
      throw error
    } finally {
      isAIResponding.value = false
    }
  }

  /**
   * Stream AI response for real-time typing effect
   */
  const streamAIResponse = async (
    messages: Message[],
    onChunk: (chunk: string) => void,
    customSystemPrompt?: string
  ): Promise<void> => {
    isAIResponding.value = true
    aiError.value = null

    try {
      const defaultSystemPrompt = `You are a helpful and friendly Thai customer service representative.
Your responses should be:
- Polite and professional in Thai language
- Concise and helpful
- Focused on solving customer problems
- Use appropriate Thai honorifics (ค่ะ/ครับ)

Keep responses brief and to the point.`

      const chatMessages = [
        {
          role: 'system' as const,
          content: customSystemPrompt || defaultSystemPrompt
        },
        ...messages.map(msg => ({
          role: msg.isUser ? 'assistant' as const : 'user' as const,
          content: msg.text
        }))
      ]

      const stream = openAIService.streamChatCompletion(chatMessages, {
        temperature: 0.7,
        max_tokens: 800  // Increased for GPT-5: reasoning tokens + visible output
      })

      for await (const chunk of stream) {
        onChunk(chunk)
      }
    } catch (error) {
      console.error('Error streaming AI response:', error)
      aiError.value = error instanceof Error ? error.message : 'Failed to stream AI response'
      throw error
    } finally {
      isAIResponding.value = false
    }
  }

  /**
   * Generate AI suggestion based on customer message
   */
  const generateSuggestion = async (
    customerMessage: string,
    conversationContext: Message[]
  ): Promise<string> => {
    const systemPrompt = `You are an AI assistant helping a customer service representative.
Suggest a brief, appropriate Thai response to the customer's message.
Keep it concise, professional, and helpful.
Use Thai honorifics (ค่ะ/ครับ).`

    const messages = [
      ...conversationContext,
      {
        user: 'Customer',
        text: customerMessage,
        time: new Date().toLocaleTimeString(),
        isUser: false
      }
    ]

    return await generateAIResponse(messages, systemPrompt)
  }

  /**
   * Analyze customer sentiment
   */
  const analyzeSentiment = async (message: string): Promise<{
    sentiment: 'positive' | 'neutral' | 'negative' | 'urgent'
    confidence: number
    suggestedTags?: string[]
  }> => {
    const systemPrompt = `Analyze the sentiment and urgency of this customer message.
Respond with ONLY a JSON object in this exact format:
{
  "sentiment": "positive" | "neutral" | "negative" | "urgent",
  "confidence": 0.0 to 1.0,
  "suggestedTags": ["tag1", "tag2"]
}

Suggested tags can be: VIP, New, Urgent, Follow-up, Complaint, Regular, Wholesale, Repeat`

    try {
      const response = await openAIService.sendChatCompletion([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ], {
        temperature: 0.3,
        max_tokens: 100
      })

      const content = response.choices[0]?.message?.content || '{}'
      return JSON.parse(content)
    } catch (error) {
      console.error('Error analyzing sentiment:', error)
      return {
        sentiment: 'neutral',
        confidence: 0,
        suggestedTags: []
      }
    }
  }

  return {
    isAIResponding: readonly(isAIResponding),
    aiError: readonly(aiError),
    generateAIResponse,
    streamAIResponse,
    generateSuggestion,
    analyzeSentiment
  }
}
