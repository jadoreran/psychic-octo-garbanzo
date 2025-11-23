<template>
  <div class="chat-container">
    <div class="chat-header">
      <div class="header-left">
        <span class="back-arrow">←</span>
        <div class="header-avatar">J</div>
        <div class="header-info">
          <div class="header-name">J</div>
          <div class="header-status">ลูกค้า - ออนไลน์</div>
        </div>
      </div>
      <div v-if="activeTags.length > 0" class="tags-container">
        <span v-for="tag in activeTags" :key="tag.id" class="tag" :style="{ background: tag.color }">
          {{ tag.name }}
        </span>
      </div>
    </div>

    <div class="messages-container" ref="messagesContainer">
      <div v-for="(message, index) in messages" :key="index" :class="['message-wrapper', message.isUser ? 'user-message' : 'other-message']">
        <div v-if="!message.isUser" class="message-avatar">{{ message.user.charAt(0).toUpperCase() }}</div>
        <div class="message-bubble">
          <div v-if="!message.isUser" class="message-sender">{{ message.user }}</div>
          <div class="message-text">{{ message.text }}</div>
          <div class="message-time">{{ message.time }}</div>
        </div>
        <div v-if="message.isUser" class="message-avatar user-avatar">{{ message.user.charAt(0).toUpperCase() }}</div>
      </div>
    </div>

    <div class="input-container">
      <!-- Quick Reply Options Popup -->
      <div v-if="showOptions" class="options-popup-container">
        <!-- Show quick replies if using /s command -->
        <div v-if="inputText.startsWith('/s')" class="options-popup">
          <div class="options-header">Quick Replies ({{ filteredOptions.length }})</div>
          <div v-if="filteredOptions.length === 0" class="no-results">
            No matching options found
          </div>
          <div
            v-for="(option, index) in filteredOptions"
            :key="index"
            :class="['option-item', { 'highlighted': index === selectedIndex }]"
            @click="selectOption(option)"
            @mouseenter="selectedIndex = index"
          >
            <div class="option-title">{{ option.label }} - {{ option.category }}</div>
            <div class="option-preview">{{ option.text }}</div>
          </div>
        </div>

        <!-- Show packages if using /p command -->
        <div v-if="inputText.startsWith('/p')" class="options-popup">
          <div class="options-header">{{ contextualTitle }} ({{ contextualSuggestions.length }})</div>
          <div
            v-for="(item, index) in contextualSuggestions"
            :key="'pkg-' + index"
            :class="['option-item', { 'highlighted': index === contextualIndex }]"
            @click="selectContextual(item)"
            @mouseenter="contextualIndex = index"
          >
            <div class="option-title">{{ item.name }}</div>
            <div class="option-preview">{{ item.description }}</div>
            <div v-if="item.price" class="item-price">{{ item.price }}</div>
          </div>
        </div>

        <!-- Show tags if using /t command -->
        <div v-if="inputText.startsWith('/t')" class="options-popup">
          <div class="options-header">Tags ({{ availableTags.length }}) - Press T to toggle</div>
          <div
            v-for="(tag, index) in availableTags"
            :key="'tag-' + tag.id"
            :class="['option-item', 'tag-item', { 'highlighted': index === tagIndex, 'tag-selected': tag.selected }]"
            @click="toggleTag(index)"
            @mouseenter="tagIndex = index"
          >
            <div class="tag-item-content">
              <span class="tag-preview" :style="{ background: tag.color }">{{ tag.name }}</span>
              <span v-if="tag.selected" class="tag-check">✓</span>
            </div>
          </div>
        </div>
      </div>

      <div class="input-wrapper">
        <button
          @click="getAISuggestion"
          class="ai-button"
          :disabled="isAIResponding || messages.length === 0"
          :title="isAIResponding ? 'AI กำลังคิด...' : 'ขอคำแนะนำจาก AI'"
        >
          <span v-if="!isAIResponding">✨</span>
          <span v-else class="ai-loading">⟳</span>
        </button>
        <input
          v-model="inputText"
          @input="handleInput"
          @keydown.enter.prevent="handleEnter"
          @keydown.esc="closeOptions"
          @keydown.down.prevent="navigateOptions(1)"
          @keydown.up.prevent="navigateOptions(-1)"
          @keydown="handleKeydown"
          type="text"
          placeholder="ส่งข้อความ..."
          class="message-input"
          ref="messageInput"
        />
        <button @click="sendMessage" class="send-button">→</button>
      </div>

      <!-- AI Error Message -->
      <div v-if="aiError" class="ai-error">
        {{ aiError }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import { useAIChat } from '~/composables/useAIChat'

// AI Integration
const { isAIResponding, aiError, generateSuggestion } = useAIChat()

interface Message {
  user: string
  text: string
  time: string
  isUser: boolean
}

interface QuickReply {
  label: string
  category: string
  text: string
  keywords: string[]
}

interface ProductPackage {
  name: string
  description: string
  price: string
}

interface Tag {
  id: number
  name: string
  color: string
  selected: boolean
}

const inputText = ref('')
const showOptions = ref(false)
const messages = ref<Message[]>([
  {
    user: 'J',
    text: 'สวัสดีครับ ผมสนใจสินค้าอยากสอบถามข้อมูล',
    time: '9:30 AM',
    isUser: false
  },
  {
    user: 'J',
    text: 'มีสินค้าตัวนี้สีอื่นไหมครับ?',
    time: '9:31 AM',
    isUser: false
  }
])
const messagesContainer = ref<HTMLDivElement | null>(null)
const messageInput = ref<HTMLInputElement | null>(null)
const selectedIndex = ref(0)
const contextualMode = ref(false)
const contextualIndex = ref(0)
const contextualTitle = ref('')
const contextualSuggestions = ref<ProductPackage[]>([])
const tagIndex = ref(0)
const availableTags = ref<Tag[]>([
  { id: 1, name: 'VIP', color: 'linear-gradient(135deg, #ff0844 0%, #c0392b 100%)', selected: false },
  { id: 2, name: 'New', color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', selected: false },
  { id: 3, name: 'Urgent', color: 'linear-gradient(135deg, #fa8231 0%, #f54ea2 100%)', selected: false },
  { id: 4, name: 'Follow-up', color: 'linear-gradient(135deg, #a29bfe 0%, #6c5ce7 100%)', selected: false },
  { id: 5, name: 'Complaint', color: 'linear-gradient(135deg, #fd79a8 0%, #e84393 100%)', selected: false },
  { id: 6, name: 'Regular', color: 'linear-gradient(135deg, #00b894 0%, #00cec9 100%)', selected: false },
  { id: 7, name: 'Wholesale', color: 'linear-gradient(135deg, #fdcb6e 0%, #e17055 100%)', selected: false },
  { id: 8, name: 'Repeat', color: 'linear-gradient(135deg, #55efc4 0%, #81ecec 100%)', selected: false }
])
const appliedTags = ref<Tag[]>([])
const activeTags = computed(() => appliedTags.value)

// Define your quick reply options here
const quickReplyOptions = ref<QuickReply[]>([
  {
    label: 'ทักทาย',
    category: 'greeting',
    text: 'สวัสดีค่ะ ยินดีให้บริการค่ะ มีอะไรให้ช่วยไหมคะ',
    keywords: ['สวัสดี', 'hello', 'hi', 'ทักทาย', 'sawas', 'sawasdee', 'sawasdika', 'gree']
  },
  {
    label: 'ขอบคุณ',
    category: 'thanks',
    text: 'ขอบคุณที่ติดต่อเรานะคะ ยินดีให้บริการค่ะ',
    keywords: ['ขอบคุณ', 'thank', 'thanks', 'khob', 'khobkhun', 'ขอบ']
  },
  {
    label: 'สินค้ามีพร้อมส่ง',
    category: 'stock',
    text: 'สินค้ามีพร้อมส่งค่ะ สั่งเลยได้เลยนะคะ',
    keywords: ['พร้อมส่ง', 'มีสินค้า', 'stock', 'available', 'phrom', 'promson', 'พร้อม', 'stoc']
  },
  {
    label: 'ราคา',
    category: 'price',
    text: 'ราคาปกติ 590 บาท ตอนนี้ลดพิเศษเหลือ 399 บาทค่ะ',
    keywords: ['ราคา', 'price', 'เท่าไหร่', 'raka', 'thao', 'thaorai', 'pric']
  },
  {
    label: 'จัดส่ง',
    category: 'shipping',
    text: 'จัดส่งฟรีทั่วไทยค่ะ ได้ของภายใน 2-3 วันค่ะ',
    keywords: ['จัดส่ง', 'ship', 'delivery', 'ส่ง', 'jad', 'jadsong', 'song', 'shipp']
  },
  {
    label: 'สอบถามเพิ่มเติม',
    category: 'question',
    text: 'มีอะไรอยากสอบถามเพิ่มเติมไหมคะ ยินดีตอบทุกคำถามนะคะ',
    keywords: ['สอบถาม', 'ถาม', 'question', 'ask', 'sobtam', 'tam', 'tham', 'ques']
  },
  {
    label: 'รอสักครู่',
    category: 'wait',
    text: 'รอสักครู่นะคะ ดิฉันเช็คให้เลยค่ะ',
    keywords: ['รอ', 'wait', 'เช็ค', 'check', 'ro', 'rosakru', 'check', 'wai']
  },
  {
    label: 'ยืนยันออเดอร์',
    category: 'confirm',
    text: 'ยืนยันออเดอร์แล้วนะคะ จัดส่งให้โดยเร็วที่สุดเลยค่ะ',
    keywords: ['ยืนยัน', 'confirm', 'order', 'สั่ง', 'yuen', 'yuenya', 'sang', 'conf']
  }
])

// Filter options based on input after "/s" or direct command
const filteredOptions = computed(() => {
  if (!inputText.value.startsWith('/')) {
    return quickReplyOptions.value
  }

  // Handle /s command
  if (inputText.value.startsWith('/s')) {
    const searchText = inputText.value.slice(2).trim().toLowerCase()

    if (searchText === '') {
      return quickReplyOptions.value
    }

    return quickReplyOptions.value.filter(option => {
      const labelMatch = option.label.toLowerCase().includes(searchText)
      const textMatch = option.text.toLowerCase().includes(searchText)
      const categoryMatch = option.category.toLowerCase().includes(searchText)
      const keywordMatch = option.keywords.some(keyword => keyword.includes(searchText))
      return labelMatch || textMatch || categoryMatch || keywordMatch
    })
  }

  // Handle /p command (packages)
  if (inputText.value.startsWith('/p')) {
    return []
  }

  // Handle direct category commands like /gree, /pric, etc.
  const command = inputText.value.slice(1).toLowerCase()
  return quickReplyOptions.value.filter(option => {
    const categoryMatch = option.category.toLowerCase().startsWith(command)
    const keywordMatch = option.keywords.some(kw => kw.toLowerCase().startsWith(command))
    return categoryMatch || keywordMatch
  })
})

// Product packages data
const productPackages = [
  {
    name: 'แพ็คเกจ A',
    description: 'สินค้า 1 ชิ้น',
    price: '฿399'
  },
  {
    name: 'แพ็คเกจ B',
    description: 'สินค้า 3 ชิ้น (ลด 10%)',
    price: '฿1,077'
  },
  {
    name: 'แพ็คเกจ C',
    description: 'สินค้า 5 ชิ้น (ลด 15%)',
    price: '฿1,699'
  }
]

// Reset selected index when filtered options change
watch(filteredOptions, () => {
  selectedIndex.value = 0
  contextualMode.value = false
  updateContextualSuggestions()
})

// Update contextual suggestions based on search
const updateContextualSuggestions = () => {
  // Check if using /p command
  if (inputText.value.startsWith('/p')) {
    contextualTitle.value = 'แพ็คเกจสินค้า'
    contextualSuggestions.value = productPackages
    contextualIndex.value = 0
    return
  }

  // For /s command, don't show contextual suggestions
  contextualSuggestions.value = []
  contextualIndex.value = 0
}

const handleInput = () => {
  // Check if user typed "/s", "/p", "/t", or a direct category command
  if (inputText.value.startsWith('/s') || inputText.value.startsWith('/p') || inputText.value.startsWith('/t')) {
    showOptions.value = true
    selectedIndex.value = 0
    tagIndex.value = 0
    updateContextualSuggestions()
  } else if (inputText.value.startsWith('/')) {
    // Check if it's a direct category command
    const command = inputText.value.slice(1).toLowerCase()
    const matchingOption = quickReplyOptions.value.find(opt =>
      opt.category.toLowerCase().startsWith(command) ||
      opt.keywords.some(kw => kw.toLowerCase().startsWith(command))
    )

    if (matchingOption) {
      showOptions.value = true
      selectedIndex.value = 0
      updateContextualSuggestions()
    } else {
      showOptions.value = false
    }
  } else {
    showOptions.value = false
  }
}

const selectOption = (option: QuickReply) => {
  inputText.value = option.text
  showOptions.value = false
  selectedIndex.value = 0
  contextualMode.value = false
  contextualSuggestions.value = []
  // Focus back on input
  nextTick(() => {
    messageInput.value?.focus()
  })
}

const selectContextual = (item: ProductPackage) => {
  inputText.value = `${item.name} - ${item.description} ${item.price ? item.price : ''}`
  showOptions.value = false
  selectedIndex.value = 0
  contextualMode.value = false
  contextualSuggestions.value = []
  // Focus back on input
  nextTick(() => {
    messageInput.value?.focus()
  })
}

const toggleTag = (index: number) => {
  availableTags.value[index].selected = !availableTags.value[index].selected
}

const applyTags = () => {
  // Save the selected tags to appliedTags
  appliedTags.value = availableTags.value.filter(tag => tag.selected)

  inputText.value = ''
  showOptions.value = false
  tagIndex.value = 0
  // Focus back on input
  nextTick(() => {
    messageInput.value?.focus()
  })
}

const handleKeydown = (event: KeyboardEvent) => {
  // Handle 't' key to toggle tags
  if (event.key === 't' && inputText.value.startsWith('/t') && showOptions.value) {
    event.preventDefault()
    toggleTag(tagIndex.value)
  }
}

const navigateOptions = (direction: number) => {
  if (!showOptions.value) return

  // If using /p, navigate packages
  if (inputText.value.startsWith('/p')) {
    contextualIndex.value += direction
    if (contextualIndex.value < 0) {
      contextualIndex.value = contextualSuggestions.value.length - 1
    } else if (contextualIndex.value >= contextualSuggestions.value.length) {
      contextualIndex.value = 0
    }
  } else if (inputText.value.startsWith('/t')) {
    // Navigate tags
    tagIndex.value += direction
    if (tagIndex.value < 0) {
      tagIndex.value = availableTags.value.length - 1
    } else if (tagIndex.value >= availableTags.value.length) {
      tagIndex.value = 0
    }
  } else {
    // Navigate quick replies for /s
    selectedIndex.value += direction
    if (selectedIndex.value < 0) {
      selectedIndex.value = filteredOptions.value.length - 1
    } else if (selectedIndex.value >= filteredOptions.value.length) {
      selectedIndex.value = 0
    }
  }
}

const handleEnter = () => {
  if (showOptions.value) {
    // If using /t, apply tags
    if (inputText.value.startsWith('/t')) {
      applyTags()
    } else if (inputText.value.startsWith('/p')) {
      // If using /p, select from packages
      const selectedPackage = contextualSuggestions.value[contextualIndex.value]
      if (selectedPackage) {
        selectContextual(selectedPackage)
      }
    } else if (filteredOptions.value.length > 0) {
      // Select highlighted quick reply
      const selectedOption = filteredOptions.value[selectedIndex.value]
      if (selectedOption) {
        selectOption(selectedOption)
      }
    }
  } else {
    // Send the message
    sendMessage()
  }
}

const closeOptions = () => {
  showOptions.value = false
  selectedIndex.value = 0
}

const sendMessage = () => {
  if (inputText.value.trim() && !inputText.value.startsWith('/')) {
    const now = new Date()
    const timeString = now.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })

    messages.value.push({
      user: 'D',
      text: inputText.value,
      time: timeString,
      isUser: true
    })

    inputText.value = ''
    showOptions.value = false

    // Scroll to bottom
    nextTick(() => {
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
      }
    })
  }
}

// AI Suggestion Function
const getAISuggestion = async () => {
  if (messages.value.length === 0) return

  try {
    const suggestion = await generateSuggestion(
      messages.value[messages.value.length - 1].text,
      messages.value
    )

    // Set the suggestion as input text
    inputText.value = suggestion

    // Focus back on input
    nextTick(() => {
      messageInput.value?.focus()
    })
  } catch (error) {
    console.error('Failed to get AI suggestion:', error)
  }
}
</script>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  background: #1a1a1a;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Noto Sans', 'Helvetica', sans-serif;
  overflow: hidden;
  position: relative;
}

.chat-header {
  padding: 12px 16px;
  background: #252525;
  border-bottom: 1px solid #3a3a3a;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 18px;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding-left: 40px;
}

.tag {
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  color: white;
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
}

.back-arrow {
  font-size: 24px;
  color: #999;
  cursor: pointer;
  transition: color 0.2s;
}

.back-arrow:hover {
  color: #fff;
}

.header-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 16px;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.header-info {
  flex: 1;
}

.header-name {
  font-weight: 600;
  font-size: 15px;
  color: #fff;
}

.header-status {
  font-size: 12px;
  color: #888;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: #1a1a1a;
}

.message-wrapper {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  align-items: flex-start;
}

.message-wrapper.user-message {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 13px;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(102, 126, 234, 0.3);
}

.user-avatar {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  box-shadow: 0 2px 6px rgba(240, 147, 251, 0.3);
}

.message-bubble {
  max-width: 70%;
  padding: 10px 14px;
  border-radius: 18px;
  background: #2a2a2a;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  border: 1px solid #3a3a3a;
}

.user-message .message-bubble {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  box-shadow: 0 2px 12px rgba(102, 126, 234, 0.4);
}

.message-sender {
  font-weight: 600;
  font-size: 12px;
  color: #888;
  margin-bottom: 4px;
}

.message-text {
  font-size: 14px;
  line-height: 1.4;
  color: #e0e0e0;
  word-wrap: break-word;
  margin-bottom: 4px;
}

.user-message .message-text {
  color: #fff;
}

.message-time {
  font-size: 10px;
  color: #666;
  text-align: right;
}

.user-message .message-time {
  color: rgba(255,255,255,0.7);
}

.input-container {
  position: relative;
  padding: 12px 16px;
  background: #252525;
  border-top: 1px solid #3a3a3a;
}

.input-wrapper {
  display: flex;
  gap: 8px;
  align-items: center;
  background: #2a2a2a;
  border-radius: 24px;
  padding: 4px 8px;
  border: 1px solid #404040;
  transition: border-color 0.2s;
}

.input-wrapper:focus-within {
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

.ai-button {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 50%;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(102, 126, 234, 0.3);
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

.ai-button:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.5);
}

.ai-button:active:not(:disabled) {
  transform: scale(0.95);
}

.ai-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ai-loading {
  display: inline-block;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.ai-error {
  margin-top: 8px;
  padding: 8px 12px;
  background: rgba(255, 56, 92, 0.1);
  border: 1px solid rgba(255, 56, 92, 0.3);
  border-radius: 8px;
  color: #ff385c;
  font-size: 12px;
  text-align: center;
}

.message-input {
  flex: 1;
  padding: 8px 12px;
  border: none;
  background: transparent;
  font-size: 14px;
  font-family: inherit;
  outline: none;
  color: #fff;
}

.message-input::placeholder {
  color: #666;
}

.send-button {
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, #FF385C 0%, #d81f43 100%);
  color: white;
  border: none;
  border-radius: 50%;
  font-size: 20px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s, box-shadow 0.2s;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(255, 56, 92, 0.3);
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

.send-button:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(255, 56, 92, 0.5);
}

.send-button:active {
  transform: scale(0.95);
}

.options-popup-container {
  position: absolute;
  bottom: 100%;
  left: 16px;
  right: 16px;
  margin-bottom: 8px;
  display: flex;
  gap: 8px;
  z-index: 100;
}

.options-popup {
  flex: 1;
  background: #2a2a2a;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.5);
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #404040;
}


.options-header {
  padding: 12px 16px;
  font-weight: 600;
  font-size: 13px;
  color: #999;
  border-bottom: 1px solid #404040;
  background: #333333;
  position: sticky;
  top: 0;
  border-radius: 12px 12px 0 0;
}

.option-item {
  padding: 16px 16px;
  cursor: pointer;
  border-bottom: 1px solid #404040;
  transition: background 0.2s, border-left 0.2s;
  border-left: 3px solid transparent;
  min-height: 48px;
  display: flex;
  align-items: center;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

.option-item:last-child {
  border-bottom: none;
  border-radius: 0 0 12px 12px;
}

.option-item:hover {
  background: #333333;
}

.option-item.highlighted {
  background: linear-gradient(90deg, rgba(102, 126, 234, 0.2) 0%, rgba(30, 30, 30, 0.8) 100%);
  border-left-color: #667eea;
}

.option-item:active {
  background: #2a2a2a;
}

.no-results {
  padding: 24px 16px;
  text-align: center;
  color: #666;
  font-size: 13px;
}

.option-title {
  font-weight: 600;
  font-size: 13px;
  color: #e0e0e0;
  margin-bottom: 4px;
}

.option-preview {
  font-size: 12px;
  color: #888;
  line-height: 1.4;
}

.item-price {
  font-size: 14px;
  font-weight: 700;
  color: #667eea;
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px solid #404040;
}

.tag-item {
  display: flex;
  align-items: center;
}

.tag-item-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.tag-preview {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  color: white;
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
}

.tag-check {
  color: #27ae60;
  font-size: 18px;
  font-weight: bold;
}

.tag-selected {
  background: rgba(102, 126, 234, 0.15);
}

/* Scrollbar styling */
.messages-container::-webkit-scrollbar,
.options-popup::-webkit-scrollbar {
  width: 6px;
}

.messages-container::-webkit-scrollbar-track,
.options-popup::-webkit-scrollbar-track {
  background: transparent;
}

.messages-container::-webkit-scrollbar-thumb,
.options-popup::-webkit-scrollbar-thumb {
  background: #333;
  border-radius: 3px;
}

.messages-container::-webkit-scrollbar-thumb:hover,
.options-popup::-webkit-scrollbar-thumb:hover {
  background: #444;
}
</style>
