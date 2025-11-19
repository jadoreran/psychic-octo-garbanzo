<template>
  <div class="chat-container">
    <div class="chat-header">
      <div class="header-left">
        <span class="back-arrow">←</span>
        <div class="header-avatar">C</div>
        <div class="header-info">
          <div class="header-name">Customer</div>
          <div class="header-status">ลูกค้า - ออนไลน์</div>
        </div>
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
            <div class="option-title">{{ option.label }}</div>
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
      </div>

      <div class="input-wrapper">
        <button class="attach-button">📎</button>
        <input
          v-model="inputText"
          @input="handleInput"
          @keydown.enter.prevent="handleEnter"
          @keydown.esc="closeOptions"
          @keydown.down.prevent="navigateOptions(1)"
          @keydown.up.prevent="navigateOptions(-1)"
          type="text"
          placeholder="ส่งข้อความ..."
          class="message-input"
          ref="messageInput"
        />
        <button @click="sendMessage" class="send-button">→</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, watch } from 'vue'

const inputText = ref('')
const showOptions = ref(false)
const messages = ref([
  {
    user: 'Customer',
    text: 'สวัสดีครับ ผมสนใจสินค้าอยากสอบถามข้อมูล',
    time: '9:30 AM',
    isUser: false
  },
  {
    user: 'Customer',
    text: 'มีสินค้าตัวนี้สีอื่นไหมครับ?',
    time: '9:31 AM',
    isUser: false
  }
])
const messagesContainer = ref(null)
const messageInput = ref(null)
const selectedIndex = ref(0)
const contextualMode = ref(false)
const contextualIndex = ref(0)
const contextualTitle = ref('')
const contextualSuggestions = ref([])

// Define your quick reply options here
const quickReplyOptions = ref([
  {
    label: 'ทักทาย',
    text: 'สวัสดีค่ะ ยินดีให้บริการค่ะ มีอะไรให้ช่วยไหมคะ',
    keywords: ['สวัสดี', 'hello', 'hi', 'ทักทาย', 'sawas', 'sawasdee', 'sawasdika']
  },
  {
    label: 'ขอบคุณ',
    text: 'ขอบคุณที่ติดต่อเรานะคะ ยินดีให้บริการค่ะ',
    keywords: ['ขอบคุณ', 'thank', 'thanks', 'khob', 'khobkhun', 'ขอบ']
  },
  {
    label: 'สินค้ามีพร้อมส่ง',
    text: 'สินค้ามีพร้อมส่งค่ะ สั่งเลยได้เลยนะคะ',
    keywords: ['พร้อมส่ง', 'มีสินค้า', 'stock', 'available', 'phrom', 'promson', 'พร้อม']
  },
  {
    label: 'ราคา',
    text: 'ราคาปกติ 590 บาท ตอนนี้ลดพิเศษเหลือ 399 บาทค่ะ',
    keywords: ['ราคา', 'price', 'เท่าไหร่', 'raka', 'raka', 'thao', 'thaorai']
  },
  {
    label: 'จัดส่ง',
    text: 'จัดส่งฟรีทั่วไทยค่ะ ได้ของภายใน 2-3 วันค่ะ',
    keywords: ['จัดส่ง', 'ship', 'delivery', 'ส่ง', 'jad', 'jadsong', 'song']
  },
  {
    label: 'สอบถามเพิ่มเติม',
    text: 'มีอะไรอยากสอบถามเพิ่มเติมไหมคะ ยินดีตอบทุกคำถามนะคะ',
    keywords: ['สอบถาม', 'ถาม', 'question', 'ask', 'sobtam', 'tam', 'tham']
  },
  {
    label: 'รอสักครู่',
    text: 'รอสักครู่นะคะ ดิฉันเช็คให้เลยค่ะ',
    keywords: ['รอ', 'wait', 'เช็ค', 'check', 'ro', 'rosakru', 'check']
  },
  {
    label: 'ยืนยันออเดอร์',
    text: 'ยืนยันออเดอร์แล้วนะคะ จัดส่งให้โดยเร็วที่สุดเลยค่ะ',
    keywords: ['ยืนยัน', 'confirm', 'order', 'สั่ง', 'yuen', 'yuenya', 'order', 'sang']
  }
])

// Filter options based on input after "/s"
const filteredOptions = computed(() => {
  if (!inputText.value.startsWith('/s')) {
    return quickReplyOptions.value
  }

  const searchText = inputText.value.slice(2).trim().toLowerCase()

  if (searchText === '') {
    return quickReplyOptions.value
  }

  return quickReplyOptions.value.filter(option => {
    const labelMatch = option.label.toLowerCase().includes(searchText)
    const textMatch = option.text.toLowerCase().includes(searchText)
    const keywordMatch = option.keywords.some(keyword => keyword.includes(searchText))
    return labelMatch || textMatch || keywordMatch
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
  // Check if user typed "/s" or "/p"
  if (inputText.value.startsWith('/s') || inputText.value.startsWith('/p')) {
    showOptions.value = true
    selectedIndex.value = 0
    updateContextualSuggestions()
  } else {
    showOptions.value = false
  }
}

const selectOption = (option) => {
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

const selectContextual = (item) => {
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

const navigateOptions = (direction) => {
  if (!showOptions.value) return

  // If using /p, navigate packages
  if (inputText.value.startsWith('/p')) {
    contextualIndex.value += direction
    if (contextualIndex.value < 0) {
      contextualIndex.value = contextualSuggestions.value.length - 1
    } else if (contextualIndex.value >= contextualSuggestions.value.length) {
      contextualIndex.value = 0
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
    // If using /p, select from packages
    if (inputText.value.startsWith('/p')) {
      selectContextual(contextualSuggestions.value[contextualIndex.value])
    } else if (filteredOptions.value.length > 0) {
      // Select highlighted quick reply
      selectOption(filteredOptions.value[selectedIndex.value])
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
  if (inputText.value.trim() && !inputText.value.startsWith('/s') && !inputText.value.startsWith('/p')) {
    const now = new Date()
    const timeString = now.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })

    messages.value.push({
      user: 'You',
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
</script>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  background: #0f0f0f;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Noto Sans', 'Helvetica', sans-serif;
  overflow: hidden;
  position: relative;
}

.chat-header {
  padding: 12px 16px;
  background: #1a1a1a;
  border-bottom: 1px solid #2a2a2a;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
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
  background: #0f0f0f;
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
  background: #1e1e1e;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  border: 1px solid #2a2a2a;
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
  background: #1a1a1a;
  border-top: 1px solid #2a2a2a;
}

.input-wrapper {
  display: flex;
  gap: 8px;
  align-items: center;
  background: #252525;
  border-radius: 24px;
  padding: 4px 8px;
  border: 1px solid #333;
  transition: border-color 0.2s;
}

.input-wrapper:focus-within {
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

.attach-button {
  background: transparent;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #888;
  transition: color 0.2s;
}

.attach-button:hover {
  color: #fff;
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
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 50%;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s, box-shadow 0.2s;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.send-button:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.5);
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
  background: #1e1e1e;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.5);
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #333;
}


.options-header {
  padding: 12px 16px;
  font-weight: 600;
  font-size: 13px;
  color: #999;
  border-bottom: 1px solid #2a2a2a;
  background: #252525;
  position: sticky;
  top: 0;
  border-radius: 12px 12px 0 0;
}

.option-item {
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid #2a2a2a;
  transition: background 0.2s, border-left 0.2s;
  border-left: 3px solid transparent;
}

.option-item:last-child {
  border-bottom: none;
  border-radius: 0 0 12px 12px;
}

.option-item:hover {
  background: #252525;
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
  border-top: 1px solid #2a2a2a;
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
