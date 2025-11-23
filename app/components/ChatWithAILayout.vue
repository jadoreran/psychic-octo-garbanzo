<template>
  <div class="chat-ai-layout">
    <!-- Chat Section -->
    <div class="chat-section">
      <ChatBox
        @ai-suggestion-requested="handleAISuggestionRequest"
        @ai-response-received="handleAIResponse"
      />
    </div>

    <!-- AI Panel Section -->
    <AISuggestionsPanel
      :is-loading="isAILoading"
      :error="aiError"
      :current-suggestion="aiSuggestion"
      :suggestion-meta="aiMeta"
      @retry="retryAISuggestion"
      @send-message="sendMessage"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ChatBox from './ChatBox.vue'
import AISuggestionsPanel from './AISuggestionsPanel.vue'
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

let lastMessages: any[] = []

const handleAISuggestionRequest = async (messages: any[]) => {
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
</script>

<style scoped>
.chat-ai-layout {
  display: flex;
  height: 100vh;
  width: 100%;
  background: #0f0f0f;
  overflow: hidden;
}

.chat-section {
  flex: 1;
  min-width: 0; /* Allow flex item to shrink below content size */
  display: flex;
  justify-content: center;
  background: #0f0f0f;
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
