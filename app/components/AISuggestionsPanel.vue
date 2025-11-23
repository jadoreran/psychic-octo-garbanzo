<template>
  <div class="ai-panel">
    <div class="ai-panel-header">
      <div class="panel-title">
        <span class="ai-icon">🤖</span>
        <span>AI Suggestions</span>
      </div>
    </div>

    <div class="ai-panel-content">
      <!-- Loading State -->
      <div v-if="isLoading" class="ai-loading-state">
        <div class="loading-spinner">⟳</div>
        <p>AI กำลังคิด...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="ai-error-state">
        <div class="error-icon">⚠️</div>
        <p>{{ error }}</p>
        <button @click="$emit('retry')" class="retry-button">ลองอีกครั้ง</button>
      </div>

      <!-- Empty State -->
      <div v-else-if="!currentSuggestion" class="ai-empty-state">
        <div class="empty-icon">💡</div>
        <p>คลิกปุ่ม ✨ เพื่อขอคำแนะนำจาก AI</p>
        <p class="empty-hint">AI จะวิเคราะห์บทสนทนาและแนะนำการตอบกลับที่เหมาะสม</p>
      </div>

      <!-- Suggestion -->
      <div v-else class="ai-suggestion">
        <div class="suggestion-header">
          <div class="suggestion-label">คำแนะนำ</div>
          <div class="suggestion-meta">
            <span class="token-info" title="Reasoning tokens used">
              🧠 {{ suggestionMeta.reasoningTokens }} tokens
            </span>
          </div>
        </div>

        <textarea
          v-model="editableText"
          class="suggestion-textarea"
          placeholder="AI suggestion will appear here..."
          rows="8"
        />

        <div class="suggestion-actions">
          <button @click="handleSend" class="send-button">
            ส่งข้อความ
          </button>
        </div>

        <!-- Model Info -->
        <div class="model-info">
          <div class="info-row">
            <span class="info-label">Model:</span>
            <span class="info-value">{{ suggestionMeta.model }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Total tokens:</span>
            <span class="info-value">{{ suggestionMeta.totalTokens }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Finish reason:</span>
            <span class="info-value">{{ suggestionMeta.finishReason }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface SuggestionMeta {
  model: string
  totalTokens: number
  reasoningTokens: number
  finishReason: string
}

const props = defineProps<{
  isLoading: boolean
  error: string | null
  currentSuggestion: string | null
  suggestionMeta: SuggestionMeta
}>()

const emit = defineEmits<{
  retry: []
  'send-message': [text: string]
}>()

const editableText = ref('')

// Watch for new AI suggestions and update editable text
watch(() => props.currentSuggestion, (newSuggestion) => {
  if (newSuggestion) {
    editableText.value = newSuggestion
  }
}, { immediate: true })

const handleSend = () => {
  if (editableText.value.trim()) {
    emit('send-message', editableText.value)
    editableText.value = ''
  }
}
</script>

<style scoped>
.ai-panel {
  position: fixed;
  right: 0;
  top: 0;
  bottom: 0;
  width: 100%;
  max-width: 400px;
  background: #1e1e1e;
  border-left: 1px solid #3a3a3a;
  box-shadow: -4px 0 16px rgba(0,0,0,0.3);
  display: flex;
  flex-direction: column;
  z-index: 1000;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

.ai-panel-header {
  padding: 16px;
  background: #252525;
  border-bottom: 1px solid #3a3a3a;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 16px;
  color: #fff;
}

.ai-icon {
  font-size: 20px;
}

.close-button {
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  color: #999;
  font-size: 20px;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-button:hover {
  background: #333;
  color: #fff;
}

.ai-panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

/* Loading State */
.ai-loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
}

.loading-spinner {
  font-size: 48px;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.ai-loading-state p {
  color: #888;
  font-size: 14px;
}

/* Error State */
.ai-error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
}

.error-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.ai-error-state p {
  color: #ff385c;
  font-size: 14px;
  margin-bottom: 16px;
}

.retry-button {
  padding: 8px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}

.retry-button:hover {
  transform: scale(1.05);
}

/* Empty State */
.ai-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.ai-empty-state p {
  color: #999;
  font-size: 14px;
  margin-bottom: 8px;
}

.empty-hint {
  color: #666;
  font-size: 12px;
  line-height: 1.5;
}

/* Suggestion */
.ai-suggestion {
  background: #2a2a2a;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #404040;
}

.suggestion-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.suggestion-label {
  font-weight: 600;
  font-size: 12px;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.suggestion-meta {
  display: flex;
  gap: 8px;
}

.token-info {
  font-size: 11px;
  color: #667eea;
  background: rgba(102, 126, 234, 0.1);
  padding: 4px 8px;
  border-radius: 6px;
  font-weight: 600;
}

.suggestion-textarea {
  width: 100%;
  color: #e0e0e0;
  font-size: 14px;
  line-height: 1.6;
  padding: 12px;
  background: #1e1e1e;
  border-radius: 8px;
  border: 1px solid #333;
  margin-bottom: 16px;
  font-family: inherit;
  resize: vertical;
  min-height: 120px;
}

.suggestion-textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

.suggestion-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.send-button {
  width: 100%;
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  background: linear-gradient(135deg, #FF385C 0%, #d81f43 100%);
  color: white;
}

.send-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 56, 92, 0.5);
}

.send-button:active {
  transform: translateY(0);
}

.model-info {
  padding: 12px;
  background: #1e1e1e;
  border-radius: 8px;
  border: 1px solid #333;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  font-size: 12px;
}

.info-row:not(:last-child) {
  border-bottom: 1px solid #2a2a2a;
}

.info-label {
  color: #888;
  font-weight: 500;
}

.info-value {
  color: #e0e0e0;
  font-weight: 600;
  font-family: 'Courier New', monospace;
}

/* Scrollbar */
.ai-panel-content::-webkit-scrollbar {
  width: 6px;
}

.ai-panel-content::-webkit-scrollbar-track {
  background: transparent;
}

.ai-panel-content::-webkit-scrollbar-thumb {
  background: #333;
  border-radius: 3px;
}

.ai-panel-content::-webkit-scrollbar-thumb:hover {
  background: #444;
}

/* Responsive */
@media (max-width: 768px) {
  .ai-panel {
    max-width: 100%;
  }
}
</style>
