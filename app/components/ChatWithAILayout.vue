<template>
  <div class="chat-ai-layout">
    <!-- Auto Tagging Panel (Left) -->
    <AutoTaggingPanel
      :is-analyzing="isTagAnalyzing"
      :suggested-tags="suggestedTags"
      @confirm-tags="handleConfirmTags"
    />

    <!-- Chat Section -->
    <div class="chat-section">
      <ChatBox
        ref="chatBoxRef"
        @ai-suggestion-requested="handleAISuggestionRequest"
        @ai-response-received="handleAIResponse"
        @lead-analysis-requested="handleLeadAnalysisRequest"
        @auto-tag-requested="handleAutoTagRequest"
      />
    </div>

    <!-- Mock Conversation Panel (Right, before AI Panel) -->
    <MockConversationPanel
      @load-conversation="handleLoadMockConversation"
    />

    <!-- AI Panel Section (Right) -->
    <AISuggestionsPanel
      :is-loading="isAILoading"
      :error="aiError"
      :current-suggestion="aiSuggestion"
      :suggestion-meta="aiMeta"
      :mode="panelMode"
      @retry="retryAISuggestion"
      @send-message="sendMessage"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ChatBox from './ChatBox.vue'
import AISuggestionsPanel from './AISuggestionsPanel.vue'
import AutoTaggingPanel from './AutoTaggingPanel.vue'
import MockConversationPanel from './MockConversationPanel.vue'
import { openAIService } from '~/services/openai.service'

const isAILoading = ref(false)
const aiError = ref<string | null>(null)
const aiSuggestion = ref<string | null>(null)
const aiMeta = ref({
  model: 'gpt-5-nano-2025-08-07',
  totalTokens: 0,
  reasoningTokens: 0,
  finishReason: ''
})
const panelMode = ref<'suggestion' | 'lead-analysis'>('suggestion')

// Auto Tagging State
const isTagAnalyzing = ref(false)
const suggestedTags = ref<string[]>([])

// ChatBox ref for mock conversation loading
const chatBoxRef = ref<InstanceType<typeof ChatBox> | null>(null)

let lastMessages: any[] = []

const handleAISuggestionRequest = async (messages: any[]) => {
  panelMode.value = 'suggestion'
  isAILoading.value = true
  aiError.value = null
  lastMessages = messages

  try {
    // Prepare messages in OpenAI format
    const systemPrompt = `You are a helpful and friendly Thai customer service representative.
Your responses should be:
- Polite and professional in Thai language
- Concise and helpful
- Focused on solving customer problems
- Use appropriate Thai honorifics (ค่ะ/ครับ)

Keep responses brief and to the point.`

    const chatMessages = [
      {
        role: 'system' as const,
        content: systemPrompt
      },
      ...messages.map(msg => ({
        role: msg.isUser ? 'assistant' as const : 'user' as const,
        content: msg.text
      }))
    ]

    // Call OpenAI API directly to get full response with metadata
    const response = await openAIService.sendChatCompletion(chatMessages, {
      temperature: 0.7,
      max_tokens: 800
    })

    // Extract suggestion and metadata
    aiSuggestion.value = response.choices[0]?.message?.content || ''
    aiMeta.value = {
      model: response.model,
      totalTokens: response.usage?.total_tokens || 0,
      reasoningTokens: response.usage?.completion_tokens_details?.reasoning_tokens || 0,
      finishReason: response.choices[0]?.finish_reason || ''
    }

    aiError.value = null
  } catch (error: any) {
    console.error('AI suggestion error:', error)
    aiError.value = error.message || 'Failed to get AI suggestion'
    aiSuggestion.value = null
  } finally {
    isAILoading.value = false
  }
}

const handleAIResponse = (data: any) => {
  aiSuggestion.value = data.suggestion
  aiMeta.value = data.meta
}

const retryAISuggestion = () => {
  if (lastMessages.length > 0) {
    handleAISuggestionRequest(lastMessages)
  }
}

const sendMessage = (text: string) => {
  // Send the message directly to the chat
  window.dispatchEvent(new CustomEvent('send-ai-message', { detail: text }))
}

const handleLeadAnalysisRequest = async (messages: any[]) => {
  panelMode.value = 'lead-analysis'
  isAILoading.value = true
  aiError.value = null
  lastMessages = messages

  try {
    // Prepare messages for lead scoring analysis
    const systemPrompt = `You are a lead scoring AI for a Thai e-commerce customer service system.

Analyze the conversation and provide a lead score from 0-100 based on:
- Purchase intent (asking about products, prices, availability)
- Budget signals (mentioning specific prices, asking for bulk discounts)
- Urgency (time-sensitive language, immediate needs)
- Engagement level (number of questions, detail in responses)
- Decision-making authority (personal pronouns, decision language)

Provide your response in Thai with this EXACT format:

คะแนน: [score]/100
ระดับ: [Hot/Warm/Cold]

เหตุผล:
- [reason 1]
- [reason 2]
- [reason 3]

คำแนะนำ:
[brief recommendation for sales team]`

    const chatMessages = [
      {
        role: 'system' as const,
        content: systemPrompt
      },
      {
        role: 'user' as const,
        content: `วิเคราะห์บทสนทนาต่อไปนี้:\n\n${messages.map(msg =>
          `${msg.isUser ? 'พนักงาน' : 'ลูกค้า'}: ${msg.text}`
        ).join('\n')}`
      }
    ]

    // Call OpenAI API for lead analysis
    const response = await openAIService.sendChatCompletion(chatMessages, {
      temperature: 0.7,
      max_tokens: 800
    })

    // Extract analysis and metadata
    aiSuggestion.value = response.choices[0]?.message?.content || ''
    aiMeta.value = {
      model: response.model,
      totalTokens: response.usage?.total_tokens || 0,
      reasoningTokens: response.usage?.completion_tokens_details?.reasoning_tokens || 0,
      finishReason: response.choices[0]?.finish_reason || ''
    }

    aiError.value = null
  } catch (error: any) {
    console.error('Lead analysis error:', error)
    aiError.value = error.message || 'Failed to analyze lead score'
    aiSuggestion.value = null
  } finally {
    isAILoading.value = false
  }
}

const handleAutoTagRequest = async (messages: any[]) => {
  isTagAnalyzing.value = true
  suggestedTags.value = []

  try {
    // Prepare messages for tag analysis
    const systemPrompt = `You are a tag classification AI for a Thai e-commerce customer service system.

Analyze the conversation and suggest ALL relevant tags that apply from this list:
- VIP
- Urgent
- New Customer
- Complaint
- Follow-up
- Wholesale
- Pre-order
- Return
- High Value
- Support

You can suggest multiple tags if they fit the conversation.
Respond with ONLY a comma-separated list of suggested tags (no explanations).

Examples:
- Simple inquiry: "New Customer, Support"
- Urgent VIP customer: "VIP, Urgent, High Value"
- Return request: "Return, Follow-up"
- Wholesale inquiry: "Wholesale, New Customer, High Value"`

    const chatMessages = [
      {
        role: 'system' as const,
        content: systemPrompt
      },
      {
        role: 'user' as const,
        content: `วิเคราะห์บทสนทนาต่อไปนี้:\n\n${messages.map(msg =>
          `${msg.isUser ? 'พนักงาน' : 'ลูกค้า'}: ${msg.text}`
        ).join('\n')}`
      }
    ]

    // Call OpenAI API for tag analysis
    const response = await openAIService.sendChatCompletion(chatMessages, {
      temperature: 0.7,
      max_tokens: 500  // Increased for GPT-5: reasoning tokens + visible output
    })

    // Extract tags from response
    const content = response.choices[0]?.message?.content || ''
    const tags = content.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
    suggestedTags.value = tags
  } catch (error: any) {
    console.error('Tag analysis error:', error)
    suggestedTags.value = []
  } finally {
    isTagAnalyzing.value = false
  }
}

const handleConfirmTags = (tags: any[]) => {
  console.log('Tags confirmed:', tags)
  // TODO: Send tags to backend
  // For now, just log them
}

const handleLoadMockConversation = (messages: any[]) => {
  // Dispatch event to load messages into ChatBox
  window.dispatchEvent(new CustomEvent('load-mock-conversation', { detail: messages }))
}
</script>

<style scoped>
.chat-ai-layout {
  display: flex;
  height: 100vh;
  width: 100%;
  background: #0f0f0f;
  overflow: hidden;
  position: relative;
}

.chat-section {
  flex: 1;
  min-width: 0; /* Allow flex item to shrink below content size */
  display: flex;
  justify-content: center;
  background: #0f0f0f;
  margin-left: 320px; /* Width of left panel */
  margin-right: 400px; /* Width of right panel */
}

/* Responsive */
@media (max-width: 1024px) {
  .chat-ai-layout {
    flex-direction: column;
  }

  .chat-section {
    flex: 1;
  }
}

@media (max-width: 768px) {
  .chat-ai-layout {
    position: relative;
  }

  .chat-section {
    width: 100%;
  }
}
</style>
