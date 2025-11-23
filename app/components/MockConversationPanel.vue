<template>
  <div class="mock-panel">
    <div class="mock-panel-header">
      <div class="panel-title">
        <span class="mock-icon">💬</span>
        <span>Mock Conversation</span>
      </div>
      <div class="header-actions">
        <label class="auto-sync-toggle" title="Auto-sync to chat">
          <input type="checkbox" v-model="autoSync" />
          <span class="toggle-label">Auto</span>
        </label>
        <button @click="togglePanel" class="toggle-button" title="Toggle Panel">
          {{ isExpanded ? '→' : '←' }}
        </button>
      </div>
    </div>

    <div v-if="isExpanded" class="mock-panel-content">
      <!-- Instructions -->
      <div class="instructions">
        <p>Enter conversation in Q&A format:</p>
        <code>Q: How are you?<br>A: I'm good<br>Q: Looking for toys<br>A: What kind?</code>
      </div>

      <!-- Mock Input -->
      <textarea
        v-model="mockInput"
        class="mock-textarea"
        placeholder="Q: สวัสดีครับ&#10;A: สวัสดีค่ะ ยินดีให้บริการค่ะ&#10;Q: ผมหาของเล่นให้ลูกครับ&#10;A: ลูกอายุเท่าไหร่คะ มีความสนใจแบบไหนคะ"
      />

      <!-- Actions -->
      <div class="mock-actions">
        <button
          @click="loadMockConversation"
          class="load-button"
          :disabled="isLoading || !mockInput.trim() || autoSync"
        >
          <span v-if="isLoading" class="button-spinner">⟳</span>
          <span v-else>{{ autoSync ? 'Auto-syncing...' : 'โหลดบทสนทนา' }}</span>
        </button>
        <button
          @click="clearMock"
          class="clear-button"
          :disabled="isLoading || !mockInput.trim()"
        >
          ล้าง
        </button>
      </div>

      <!-- Preset Templates -->
      <div class="templates-section">
        <div class="section-title">Templates</div>
        <div class="templates-grid">
          <button
            v-for="template in templates"
            :key="template.name"
            @click="loadTemplate(template)"
            class="template-chip"
          >
            {{ template.name }}
          </button>
        </div>
      </div>

      <!-- Preview -->
      <div v-if="parsedMessages.length > 0" class="preview-section">
        <div class="section-title">Preview ({{ parsedMessages.length }} messages)</div>
        <div class="preview-list">
          <div
            v-for="(msg, index) in parsedMessages"
            :key="index"
            class="preview-message"
            :class="{ 'is-customer': !msg.isUser }"
          >
            <span class="preview-label">{{ msg.isUser ? 'Agent' : 'Customer' }}:</span>
            <span class="preview-text">{{ msg.text }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface Message {
  user: string
  text: string
  time: string
  isUser: boolean
}

const emit = defineEmits<{
  'load-conversation': [messages: Message[]]
}>()

const isExpanded = ref(true)
const isLoading = ref(false)
const mockInput = ref('')
const autoSync = ref(true) // Auto-sync toggle

const templates = ref([
  {
    name: 'VIP Customer',
    content: `Q: สวัสดีครับ ผมเป็นลูกค้า VIP
A: สวัสดีค่ะคุณลูกค้า ยินดีให้บริการค่ะ
Q: ผมต้องการสั่งสินค้าจำนวนมากครับ ลดราคาได้ไหม
A: ได้เลยค่ะ สำหรับลูกค้า VIP เรามีส่วนลดพิเศษค่ะ`
  },
  {
    name: 'Complaint',
    content: `Q: สินค้าที่ได้รับไม่ตรงกับที่สั่ง
A: ขอโทษด้วยนะคะ ให้ดิฉันช่วยตรวจสอบให้ค่ะ
Q: ผมต้องการคืนสินค้าและขอเงินคืน
A: เข้าใจค่ะ ดิฉันจะดำเนินการให้ทันทีค่ะ`
  },
  {
    name: 'New Customer',
    content: `Q: สวัสดีครับ ผมลูกค้าใหม่
A: สวัสดีค่ะ ยินดีต้อนรับค่ะ
Q: มีสินค้าแนะนำไหมครับ
A: มีค่ะ ขอทราบว่าสนใจสินค้าประเภทไหนคะ`
  },
  {
    name: 'Wholesale Inquiry',
    content: `Q: สอบถามราคาส่งหน่อยครับ
A: ได้เลยค่ะ สั่งจำนวนเท่าไหร่คะ
Q: สั่ง 100 ชิ้น ลดได้ไหม
A: ได้ค่ะ ราคาส่งพิเศษสำหรับคุณเลยค่ะ`
  },
  {
    name: 'Urgent Order',
    content: `Q: ต้องการสินค้าด่วนมากครับ
A: เข้าใจค่ะ ต้องการเมื่อไหร่คะ
Q: พรุ่งนี้ได้ไหมครับ
A: ได้ค่ะ เราจัดส่งด่วนพิเศษให้เลยค่ะ`
  }
])

// Parse mock conversation into messages
const parsedMessages = computed(() => {
  if (!mockInput.value.trim()) return []

  const lines = mockInput.value.split('\n').filter(line => line.trim())
  const messages: Message[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('Q:')) {
      // Customer question
      const text = trimmed.substring(2).trim()
      if (text) {
        messages.push({
          user: 'Customer',
          text,
          time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
          isUser: false
        })
      }
    } else if (trimmed.startsWith('A:')) {
      // Agent answer
      const text = trimmed.substring(2).trim()
      if (text) {
        messages.push({
          user: 'Agent',
          text,
          time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
          isUser: true
        })
      }
    }
  }

  return messages
})

const togglePanel = () => {
  isExpanded.value = !isExpanded.value
}

const loadMockConversation = async () => {
  if (parsedMessages.value.length === 0) return

  isLoading.value = true

  // Simulate a small delay
  await new Promise(resolve => setTimeout(resolve, 300))

  emit('load-conversation', parsedMessages.value)
  isLoading.value = false
}

const clearMock = () => {
  mockInput.value = ''
}

const loadTemplate = (template: typeof templates.value[0]) => {
  mockInput.value = template.content
}

// Auto-sync: Watch mockInput and auto-load when it changes
watch(mockInput, () => {
  if (autoSync.value && parsedMessages.value.length > 0) {
    emit('load-conversation', parsedMessages.value)
  }
}, { debounce: 500 }) // Debounce to avoid too many updates while typing
</script>

<style scoped>
.mock-panel {
  position: fixed;
  right: 400px; /* After AI panel */
  top: 0;
  bottom: 0;
  width: 100%;
  max-width: 350px;
  background: #1e1e1e;
  border-left: 1px solid #3a3a3a;
  box-shadow: -4px 0 16px rgba(0,0,0,0.3);
  display: flex;
  flex-direction: column;
  z-index: 999;
  animation: slideIn 0.3s ease-out;
  transition: max-width 0.3s ease;
}

.mock-panel:not(:has(.mock-panel-content)) {
  max-width: 50px;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

.mock-panel-header {
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

.mock-icon {
  font-size: 20px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.auto-sync-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  padding: 4px 8px;
  background: rgba(79, 172, 254, 0.1);
  border-radius: 6px;
  transition: all 0.2s;
}

.auto-sync-toggle:hover {
  background: rgba(79, 172, 254, 0.2);
}

.auto-sync-toggle input[type="checkbox"] {
  width: 14px;
  height: 14px;
  cursor: pointer;
  accent-color: #4facfe;
}

.toggle-label {
  font-size: 11px;
  color: #4facfe;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.toggle-button {
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  color: #999;
  font-size: 18px;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toggle-button:hover {
  background: #333;
  color: #fff;
}

.mock-panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Instructions */
.instructions {
  background: #2a2a2a;
  border-radius: 8px;
  padding: 12px;
  border: 1px solid #404040;
}

.instructions p {
  color: #999;
  font-size: 12px;
  margin-bottom: 8px;
}

.instructions code {
  display: block;
  color: #4facfe;
  font-size: 11px;
  line-height: 1.6;
  font-family: 'Courier New', monospace;
}

/* Mock Input */
.mock-textarea {
  width: 100%;
  min-height: 200px;
  color: #e0e0e0;
  font-size: 13px;
  line-height: 1.8;
  padding: 12px;
  background: #1e1e1e;
  border-radius: 8px;
  border: 1px solid #333;
  font-family: 'Courier New', monospace;
  resize: vertical;
}

.mock-textarea:focus {
  outline: none;
  border-color: #4facfe;
  box-shadow: 0 0 0 2px rgba(79, 172, 254, 0.2);
}

/* Actions */
.mock-actions {
  display: flex;
  gap: 8px;
}

.load-button,
.clear-button {
  flex: 1;
  padding: 10px 14px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.load-button {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
}

.load-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(79, 172, 254, 0.5);
}

.load-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.clear-button {
  background: transparent;
  color: #999;
  border: 1px solid #3a3a3a;
}

.clear-button:hover:not(:disabled) {
  background: #2a2a2a;
  color: #fff;
}

.clear-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.button-spinner {
  display: inline-block;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Templates */
.templates-section {
  background: #2a2a2a;
  border-radius: 8px;
  padding: 12px;
  border: 1px solid #404040;
}

.section-title {
  font-size: 11px;
  font-weight: 600;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 10px;
}

.templates-grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.template-chip {
  padding: 8px 12px;
  background: #1e1e1e;
  color: #4facfe;
  border: 1px solid #333;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  font-family: inherit;
}

.template-chip:hover {
  background: #252525;
  border-color: #4facfe;
  transform: translateX(4px);
}

/* Preview */
.preview-section {
  background: #2a2a2a;
  border-radius: 8px;
  padding: 12px;
  border: 1px solid #404040;
}

.preview-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
}

.preview-message {
  padding: 8px 10px;
  background: #1e1e1e;
  border-radius: 6px;
  border-left: 3px solid #667eea;
  font-size: 12px;
}

.preview-message.is-customer {
  border-left-color: #4facfe;
}

.preview-label {
  color: #999;
  font-weight: 600;
  margin-right: 6px;
}

.preview-text {
  color: #e0e0e0;
}

/* Scrollbar */
.mock-panel-content::-webkit-scrollbar,
.preview-list::-webkit-scrollbar {
  width: 6px;
}

.mock-panel-content::-webkit-scrollbar-track,
.preview-list::-webkit-scrollbar-track {
  background: transparent;
}

.mock-panel-content::-webkit-scrollbar-thumb,
.preview-list::-webkit-scrollbar-thumb {
  background: #333;
  border-radius: 3px;
}

.mock-panel-content::-webkit-scrollbar-thumb:hover,
.preview-list::-webkit-scrollbar-thumb:hover {
  background: #444;
}

/* Responsive */
@media (max-width: 1400px) {
  .mock-panel {
    right: 0;
    max-width: 100%;
  }
}
</style>
