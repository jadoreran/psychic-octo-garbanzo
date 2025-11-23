<template>
  <div class="tag-panel">
    <div class="tag-panel-header">
      <div class="panel-title">
        <span class="tag-icon">🏷️</span>
        <span>Auto Tagging</span>
      </div>
    </div>

    <div class="tag-panel-content">
      <!-- Available Tags -->
      <div class="tags-section">
        <div class="section-title">Available Tags</div>
        <div class="tags-grid">
          <button
            v-for="tag in availableTags"
            :key="tag.id"
            @click="toggleTag(tag)"
            class="tag-chip"
            :class="{ 'selected': tag.selected }"
            :style="{ background: tag.selected ? tag.color : 'transparent', borderColor: tag.color }"
          >
            {{ tag.name }}
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isAnalyzing" class="analyzing-state">
        <div class="loading-spinner">⟳</div>
        <p>AI กำลังวิเคราะห์แท็ก...</p>
      </div>

      <!-- AI Suggestions -->
      <div v-if="suggestedTags.length > 0 && !isAnalyzing" class="suggestions-section">
        <div class="section-title">AI Suggestions</div>
        <div class="suggestions-list">
          <div
            v-for="suggestion in suggestedTags"
            :key="suggestion"
            class="suggestion-item"
          >
            <span>{{ suggestion }}</span>
            <button @click="applySuggestion(suggestion)" class="apply-btn">
              เพิ่ม
            </button>
          </div>
        </div>
      </div>

      <!-- Selected Tags -->
      <div v-if="selectedTags.length > 0" class="selected-section">
        <div class="section-title">Selected Tags ({{ selectedTags.length }})</div>
        <div class="selected-tags">
          <div
            v-for="tag in selectedTags"
            :key="tag.id"
            class="selected-tag"
            :style="{ background: tag.color }"
          >
            <span>{{ tag.name }}</span>
            <button @click="removeTag(tag)" class="remove-btn">×</button>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="tag-actions">
        <button
          @click="handleConfirm"
          class="confirm-button"
          :disabled="isSaving || !tagsHaveChanged"
        >
          <span v-if="isSaving" class="button-spinner">⟳</span>
          <span v-else>{{ hasConfirmedOnce ? 'อัพเดทแท็ก' : 'ยืนยันแท็ก' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface Tag {
  id: number
  name: string
  color: string
  selected: boolean
}

const props = defineProps<{
  isAnalyzing: boolean
  suggestedTags: string[]
}>()

const emit = defineEmits<{
  'confirm-tags': [tags: Tag[]]
  'analyze-tags': []
}>()

// Default 10 tags
const availableTags = ref<Tag[]>([
  { id: 1, name: 'VIP', color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', selected: false },
  { id: 2, name: 'Urgent', color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', selected: false },
  { id: 3, name: 'New Customer', color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', selected: false },
  { id: 4, name: 'Complaint', color: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', selected: false },
  { id: 5, name: 'Follow-up', color: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)', selected: false },
  { id: 6, name: 'Wholesale', color: 'linear-gradient(135deg, #fdcb6e 0%, #e17055 100%)', selected: false },
  { id: 7, name: 'Pre-order', color: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', selected: false },
  { id: 8, name: 'Return', color: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)', selected: false },
  { id: 9, name: 'High Value', color: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', selected: false },
  { id: 10, name: 'Support', color: 'linear-gradient(135deg, #ff6e7f 0%, #bfe9ff 100%)', selected: false }
])

const isSaving = ref(false)
const hasConfirmedOnce = ref(false)
const lastConfirmedTags = ref<number[]>([]) // Store IDs of last confirmed tags

const selectedTags = computed(() => availableTags.value.filter(tag => tag.selected))

// Check if current selection is same as last confirmed
const tagsHaveChanged = computed(() => {
  const currentIds = selectedTags.value.map(t => t.id).sort()
  const lastIds = [...lastConfirmedTags.value].sort()

  if (currentIds.length !== lastIds.length) return true

  return !currentIds.every((id, index) => id === lastIds[index])
})

// Auto-apply AI suggested tags
watch(() => props.suggestedTags, (newSuggestions) => {
  if (newSuggestions && newSuggestions.length > 0) {
    // Auto-select all suggested tags
    newSuggestions.forEach(suggestion => {
      const matchingTag = availableTags.value.find(
        tag => tag.name.toLowerCase() === suggestion.toLowerCase()
      )
      if (matchingTag && !matchingTag.selected) {
        matchingTag.selected = true
      }
    })
  }
})

const toggleTag = (tag: Tag) => {
  tag.selected = !tag.selected
}

const removeTag = (tag: Tag) => {
  tag.selected = false
}

const applySuggestion = (suggestion: string) => {
  // Find matching tag by name (case insensitive)
  const matchingTag = availableTags.value.find(
    tag => tag.name.toLowerCase() === suggestion.toLowerCase()
  )

  if (matchingTag && !matchingTag.selected) {
    matchingTag.selected = true
  }
}

const handleConfirm = async () => {
  isSaving.value = true

  // Mock API call
  await new Promise(resolve => setTimeout(resolve, 1000))

  emit('confirm-tags', selectedTags.value)
  lastConfirmedTags.value = selectedTags.value.map(t => t.id)
  hasConfirmedOnce.value = true
  isSaving.value = false
}
</script>

<style scoped>
.tag-panel {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: 100%;
  max-width: 320px;
  background: #1e1e1e;
  border-right: 1px solid #3a3a3a;
  box-shadow: 4px 0 16px rgba(0,0,0,0.3);
  display: flex;
  flex-direction: column;
  z-index: 1000;
  animation: slideInLeft 0.3s ease-out;
}

@keyframes slideInLeft {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
}

.tag-panel-header {
  padding: 16px;
  background: #252525;
  border-bottom: 1px solid #3a3a3a;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 16px;
  color: #fff;
}

.tag-icon {
  font-size: 20px;
}

.tag-panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section-title {
  font-size: 12px;
  font-weight: 600;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
}

/* Available Tags Grid */
.tags-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.tag-chip {
  padding: 8px 12px;
  border: 2px solid;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  color: #fff;
  font-family: inherit;
}

.tag-chip:hover {
  transform: scale(1.05);
}

.tag-chip.selected {
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}

/* Analyzing State */
.analyzing-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  text-align: center;
  background: #2a2a2a;
  border-radius: 12px;
}

.loading-spinner {
  font-size: 48px;
  animation: spin 1s linear infinite;
  margin-bottom: 12px;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.analyzing-state p {
  color: #888;
  font-size: 14px;
}

/* AI Suggestions */
.suggestions-section {
  background: #2a2a2a;
  border-radius: 12px;
  padding: 12px;
  border: 1px solid #404040;
}

.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.suggestion-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #1e1e1e;
  border-radius: 8px;
  border: 1px solid #333;
}

.suggestion-item span {
  color: #e0e0e0;
  font-size: 14px;
}

.apply-btn {
  padding: 4px 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.apply-btn:hover {
  transform: scale(1.05);
}

/* Selected Tags */
.selected-section {
  background: #2a2a2a;
  border-radius: 12px;
  padding: 12px;
  border: 1px solid #404040;
}

.selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.selected-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
}

.remove-btn {
  width: 20px;
  height: 20px;
  background: rgba(0,0,0,0.3);
  border: none;
  border-radius: 50%;
  color: #fff;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-btn:hover {
  background: rgba(0,0,0,0.5);
  transform: scale(1.1);
}

/* Actions */
.tag-actions {
  display: flex;
  gap: 8px;
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid #3a3a3a;
}

.confirm-button {
  width: 100%;
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.confirm-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.5);
}

.confirm-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.button-spinner {
  display: inline-block;
  animation: spin 1s linear infinite;
}

/* Scrollbar */
.tag-panel-content::-webkit-scrollbar {
  width: 6px;
}

.tag-panel-content::-webkit-scrollbar-track {
  background: transparent;
}

.tag-panel-content::-webkit-scrollbar-thumb {
  background: #333;
  border-radius: 3px;
}

.tag-panel-content::-webkit-scrollbar-thumb:hover {
  background: #444;
}

/* Responsive */
@media (max-width: 768px) {
  .tag-panel {
    max-width: 100%;
  }
}
</style>
