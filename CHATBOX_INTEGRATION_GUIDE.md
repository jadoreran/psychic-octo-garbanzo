# ChatBox.vue Integration Guide

## Changes Needed in ChatBox.vue

### 1. Add event emitter to script setup

Add this line at the top of the `<script setup>` section (around line 122):

```typescript
// No import needed - defineEmits is a compiler macro
const emit = defineEmits<{
  'ai-suggestion-requested': [messages: Message[]]
}>()
```

### 2. Update the imports at the top of <script setup>

Change this line (around line 121):
```typescript
import { ref, computed, nextTick, watch } from 'vue'
```

To include onMounted and onBeforeUnmount:
```typescript
import { ref, computed, nextTick, watch, onMounted, onBeforeUnmount } from 'vue'
```

### 3. Update getAISuggestion function

Replace the existing `getAISuggestion` function (around line 485-504) with:

```typescript
const getAISuggestion = async () => {
  if (messages.value.length === 0) return

  // Emit event to parent layout component
  emit('ai-suggestion-requested', messages.value)
}
```

### 4. Add event listener for using suggestions

Add this in the `<script setup>` section (after the appliedTags ref, around line 189):

```typescript
// Listen for AI panel "Use Suggestion" clicks
const handleUseSuggestion = (event: CustomEvent) => {
  inputText.value = event.detail
  nextTick(() => {
    messageInput.value?.focus()
  })
}

onMounted(() => {
  window.addEventListener('use-ai-suggestion', handleUseSuggestion as EventListener)
})

onBeforeUnmount(() => {
  window.removeEventListener('use-ai-suggestion', handleUseSuggestion as EventListener)
})
```

## Summary of Changes

1. ✅ Add `defineEmits` (no import needed)
2. ✅ Update imports to include `onMounted` and `onBeforeUnmount`
3. ✅ Simplify `getAISuggestion` to just emit the event
4. ✅ Add event listener for the AI panel's "Use Suggestion" button

## That's it!

The ChatBox will now:
- Emit messages to the parent when AI button (✨) is clicked
- Listen for suggestions from the AI panel
- Auto-fill the input when "Use Suggestion" is clicked in the AI panel

The AI panel on the right will:
- Show loading state while AI thinks (⟳ spinner)
- Display the AI response with Thai text
- Show metadata (tokens used, reasoning tokens, model, finish reason)
- Allow copying or using the suggestion
- Display errors if something goes wrong
