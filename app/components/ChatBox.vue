<template>
  <div class="chat-container">
    <div class="chat-header">
      <div class="header-left">
        <span class="back-arrow">←</span>
        <div class="header-avatar">A</div>
        <div class="header-info">
          <div class="header-name">Admin A</div>
          <div class="header-status">ห้องแอดมินเบื้องต้น</div>
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
      <div v-if="showOptions" class="options-popup">
        <div class="options-header">/s - Quick Replies {{ filteredOptions.length > 0 ? `(${filteredOptions.length})` : '' }}</div>
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
const messages = ref([])
const messagesContainer = ref(null)
const messageInput = ref(null)
const selectedIndex = ref(0)

// Define your quick reply options here
const quickReplyOptions = ref([
  {
    label: 'Greeting',
    text: 'Hello! How can I help you today?',
    keywords: ['hello', 'hi', 'greeting', 'hey']
  },
  {
    label: 'Thank You',
    text: 'Thank you so much for your help!',
    keywords: ['thank', 'thanks', 'appreciate']
  },
  {
    label: 'Meeting',
    text: 'Let\'s schedule a meeting to discuss this further.',
    keywords: ['meeting', 'schedule', 'discuss', 'call']
  },
  {
    label: 'Follow Up',
    text: 'I\'ll follow up on this and get back to you soon.',
    keywords: ['follow', 'followup', 'later', 'back']
  },
  {
    label: 'Approval',
    text: 'Looks good to me! Approved ✓',
    keywords: ['approve', 'good', 'ok', 'yes', 'lgtm']
  },
  {
    label: 'Working On It',
    text: 'I\'m working on this right now, will update you shortly.',
    keywords: ['working', 'progress', 'update', 'wip']
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

// Reset selected index when filtered options change
watch(filteredOptions, () => {
  selectedIndex.value = 0
})

const handleInput = () => {
  // Check if user typed "/s"
  if (inputText.value.startsWith('/s')) {
    showOptions.value = true
    selectedIndex.value = 0
  } else {
    showOptions.value = false
  }
}

const selectOption = (option) => {
  inputText.value = option.text
  showOptions.value = false
  selectedIndex.value = 0
  // Focus back on input
  nextTick(() => {
    messageInput.value?.focus()
  })
}

const navigateOptions = (direction) => {
  if (!showOptions.value || filteredOptions.value.length === 0) return

  selectedIndex.value += direction

  // Wrap around
  if (selectedIndex.value < 0) {
    selectedIndex.value = filteredOptions.value.length - 1
  } else if (selectedIndex.value >= filteredOptions.value.length) {
    selectedIndex.value = 0
  }
}

const handleEnter = () => {
  if (showOptions.value && filteredOptions.value.length > 0) {
    // Select the highlighted option
    selectOption(filteredOptions.value[selectedIndex.value])
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
  if (inputText.value.trim() && !inputText.value.startsWith('/s')) {
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
  height: 100vh;
  max-width: 600px;
  margin: 0 auto;
  background: #f5f5f5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Noto Sans', 'Helvetica', sans-serif;
}

.chat-header {
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #e5e5e5;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.back-arrow {
  font-size: 24px;
  color: #666;
  cursor: pointer;
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
}

.header-info {
  flex: 1;
}

.header-name {
  font-weight: 600;
  font-size: 15px;
  color: #000;
}

.header-status {
  font-size: 12px;
  color: #666;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: #f5f5f5;
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
}

.user-avatar {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.message-bubble {
  max-width: 70%;
  padding: 10px 14px;
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 1px 2px rgba(0,0,0,0.08);
}

.user-message .message-bubble {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.message-sender {
  font-weight: 600;
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.message-text {
  font-size: 14px;
  line-height: 1.4;
  color: #000;
  word-wrap: break-word;
  margin-bottom: 4px;
}

.user-message .message-text {
  color: #fff;
}

.message-time {
  font-size: 10px;
  color: #999;
  text-align: right;
}

.user-message .message-time {
  color: rgba(255,255,255,0.8);
}

.input-container {
  position: relative;
  padding: 12px 16px;
  background: #fff;
  border-top: 1px solid #e5e5e5;
}

.input-wrapper {
  display: flex;
  gap: 8px;
  align-items: center;
  background: #f5f5f5;
  border-radius: 24px;
  padding: 4px 8px;
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
}

.message-input {
  flex: 1;
  padding: 8px 12px;
  border: none;
  background: transparent;
  font-size: 14px;
  font-family: inherit;
  outline: none;
}

.message-input::placeholder {
  color: #999;
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
  transition: transform 0.2s;
  flex-shrink: 0;
}

.send-button:hover {
  transform: scale(1.05);
}

.send-button:active {
  transform: scale(0.95);
}

.options-popup {
  position: absolute;
  bottom: 100%;
  left: 16px;
  right: 16px;
  margin-bottom: 8px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
  max-height: 400px;
  overflow-y: auto;
  z-index: 100;
}

.options-header {
  padding: 12px 16px;
  font-weight: 600;
  font-size: 13px;
  color: #666;
  border-bottom: 1px solid #e5e5e5;
  background: #f9f9f9;
  position: sticky;
  top: 0;
  border-radius: 12px 12px 0 0;
}

.option-item {
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.2s, border-left 0.2s;
  border-left: 3px solid transparent;
}

.option-item:last-child {
  border-bottom: none;
  border-radius: 0 0 12px 12px;
}

.option-item:hover {
  background: #f5f5f5;
}

.option-item.highlighted {
  background: linear-gradient(90deg, rgba(102, 126, 234, 0.1) 0%, rgba(245, 245, 245, 0.5) 100%);
  border-left-color: #667eea;
}

.option-item:active {
  background: #ebebeb;
}

.no-results {
  padding: 24px 16px;
  text-align: center;
  color: #999;
  font-size: 13px;
}

.option-title {
  font-weight: 600;
  font-size: 13px;
  color: #000;
  margin-bottom: 4px;
}

.option-preview {
  font-size: 12px;
  color: #666;
  line-height: 1.4;
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
  background: #ddd;
  border-radius: 3px;
}

.messages-container::-webkit-scrollbar-thumb:hover,
.options-popup::-webkit-scrollbar-thumb:hover {
  background: #bbb;
}
</style>
