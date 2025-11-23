# AI Integration Guide

## Overview

Your chatbox now has OpenAI integration! The AI can suggest responses based on the conversation context, helping customer service representatives reply faster and more effectively.

## Project Structure

```
app/
├── components/
│   └── ChatBox.vue              # Main chat component with AI button
├── composables/
│   └── useAIChat.ts             # Composable for AI functionality
├── services/
│   └── openai.service.ts        # OpenAI API service layer
.env                              # Environment variables (API keys)
.env.example                      # Example environment file
nuxt.config.ts                    # Nuxt configuration
```

## Setup Instructions

### 1. Install Dependencies

No additional dependencies needed! The integration uses native `fetch` API.

### 2. Configure API Key

1. Open the `.env` file in the root directory
2. Replace `your_openai_api_key_here` with your actual OpenAI API key:

```env
NUXT_PUBLIC_OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
```

**⚠️ Important**: Never commit your `.env` file to git. It's already in `.gitignore`.

### 3. Get Your OpenAI API Key

1. Go to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key and paste it in your `.env` file

### 4. Restart Dev Server

After updating the `.env` file, restart your Nuxt dev server:

```bash
npm run dev
```

## Features

### 1. AI Suggestion Button (✨)

- Click the sparkle button (✨) to get AI-generated response suggestions
- The AI analyzes the conversation context and suggests appropriate Thai responses
- The suggestion appears in the input field, ready to edit or send

### 2. Loading States

- The button shows a spinning icon (⟳) while AI is thinking
- Button is disabled when there are no messages to analyze

### 3. Error Handling

- If the API key is missing or invalid, an error message appears
- Network errors are caught and displayed to the user

## How It Works

### Architecture

1. **Service Layer** (`openai.service.ts`)
   - Handles all communication with OpenAI API
   - Provides methods for chat completions
   - Supports streaming responses (for future use)

2. **Composable** (`useAIChat.ts`)
   - Vue composable that wraps the service
   - Manages reactive state (loading, errors)
   - Provides easy-to-use functions for components

3. **Component** (`ChatBox.vue`)
   - Uses the composable to get AI suggestions
   - Displays loading states and errors
   - Integrates seamlessly with existing chat UI

### AI System Prompt

The AI is configured to:
- Respond in polite, professional Thai
- Use appropriate Thai honorifics (ค่ะ/ครับ)
- Keep responses brief and helpful
- Focus on solving customer problems

You can customize this in `useAIChat.ts` by modifying the system prompt.

## API Configuration

### Model

Currently using: `gpt-4o-mini` (fast and cost-effective)

You can change this in `openai.service.ts`:

```typescript
model: 'gpt-4o-mini'  // or 'gpt-4o', 'gpt-3.5-turbo', etc.
```

### Parameters

- `temperature: 0.7` - Balanced creativity
- `max_tokens: 200` - Short, focused responses

Adjust these in the composable or service as needed.

## Cost Estimation

**gpt-4o-mini** pricing (as of 2024):
- ~$0.00015 per suggestion (200 tokens)
- ~$0.15 per 1,000 suggestions

Very cost-effective for customer service use!

## Advanced Features

### Sentiment Analysis

The composable includes a `analyzeSentiment()` function that can:
- Detect customer sentiment (positive/neutral/negative/urgent)
- Suggest appropriate tags based on message content
- Help prioritize conversations

Example usage:

```typescript
const { analyzeSentiment } = useAIChat()

const analysis = await analyzeSentiment("ผมรอมา 3 วันแล้ว ของยังไม่มา!")
// { sentiment: "urgent", confidence: 0.9, suggestedTags: ["Urgent", "Follow-up"] }
```

### Streaming Responses

For real-time typing effect (not yet implemented in UI):

```typescript
const { streamAIResponse } = useAIChat()

await streamAIResponse(messages, (chunk) => {
  // Update UI with each chunk
  inputText.value += chunk
})
```

## Troubleshooting

### "OpenAI API key is not configured"

Check that:
1. Your `.env` file exists in the project root
2. The key is named `NUXT_PUBLIC_OPENAI_API_KEY`
3. You've restarted the dev server

### "Failed to generate AI response"

Check:
1. Your API key is valid
2. You have credits in your OpenAI account
3. Your internet connection is working
4. Check browser console for detailed error messages

### Type Errors

If you see TypeScript errors:
1. Make sure all files are saved
2. Restart the TypeScript server in VS Code
3. Check that all imports are correct

## Security Notes

1. **Never expose your API key** - It's in `.env` which is gitignored
2. **Client-side API calls** - Currently the API key is public in the client code. For production, you should:
   - Move API calls to server-side API routes (`server/api/`)
   - Use environment variables on the server only
   - Implement rate limiting

### Production-Ready Security (Future)

Create `server/api/ai-suggest.post.ts`:

```typescript
export default defineEventHandler(async (event) => {
  const { messages } = await readBody(event)

  // API key is only on server, never exposed to client
  const config = useRuntimeConfig()
  // Call OpenAI from server

  return { suggestion: '...' }
})
```

## Next Steps

1. ✅ Test the AI suggestion feature
2. ✅ Customize the system prompt if needed
3. ⏭️ Implement server-side API routes for production
4. ⏭️ Add sentiment analysis to auto-tag conversations
5. ⏭️ Implement streaming for real-time typing effect
6. ⏭️ Add conversation memory/context management

## Questions?

Check the code comments in:
- `app/services/openai.service.ts` - API integration details
- `app/composables/useAIChat.ts` - Usage examples
- `app/components/ChatBox.vue` - Component integration

Happy coding! 🚀

---

## Model-Specific API Parameter Guide (Updated 2025)

### ⚠️ CRITICAL: OpenAI API Parameter Compatibility

Different OpenAI models have different parameter requirements. Using incompatible parameters will result in **400 Bad Request** errors.

### GPT-5 Series (nano, mini, chat) - Current Default: `gpt-5-nano-2025-08-07`

**Supported:**
- ✅ `max_completion_tokens` (NOT `max_tokens`)
- ✅ `messages`, `model`, `stream`

**NOT Supported:**
- ❌ `temperature` - Only default (1) is supported. Omit this parameter entirely.
- ❌ `top_p`, `presence_penalty`, `frequency_penalty`

**Error Example:**
```
400 Unsupported parameter: 'max_tokens' is not supported with this model. Use 'max_completion_tokens' instead.
400 Unsupported value: 'temperature' does not support 0.7 with this model. Only the default (1) value is supported.
```

### Reasoning Models (o1, o3, o4)

**Same restrictions as GPT-5 series**

### GPT-4o, GPT-4-turbo

**Supported:**
- ✅ `max_completion_tokens` (NOT `max_tokens`)
- ✅ `temperature` (0.0 - 2.0)
- ✅ All standard parameters

### Legacy Models (GPT-3.5, GPT-4)

**Supported:**
- ✅ `max_tokens` (NOT `max_completion_tokens`)
- ✅ `temperature` (0.0 - 2.0)
- ✅ All standard parameters

### Implementation

The `openai.service.ts` handles all of this automatically:

```typescript
// Helper methods detect model capabilities
private usesNewTokenParam(model: string): boolean
private supportsCustomTemperature(model: string): boolean

// Parameters are conditionally included based on model
const params: any = { model, messages }

if (this.supportsCustomTemperature(model)) {
  params.temperature = temperature  // Only for compatible models
}

if (this.usesNewTokenParam(model)) {
  params.max_completion_tokens = max_tokens  // GPT-5, o1, o3, GPT-4o
} else {
  params.max_tokens = max_tokens  // GPT-3.5, GPT-4
}
```

### Documentation References

See inline comments in `openai.service.ts` for:
- Direct links to OpenAI community discussions
- GitHub issues tracking these limitations
- API documentation references

**This approach ensures the code itself serves as documentation and prevents future 400 errors.**


### ⚠️ CRITICAL: Reasoning Tokens in GPT-5 & O-Series Models

**Problem:** Empty responses with `finish_reason: "length"`

GPT-5 and O-series models (o1, o3, o4) use **reasoning tokens** internally for thinking/planning before generating output. These reasoning tokens count toward `max_completion_tokens`.

**Example Issue:**
```json
{
  "choices": [{
    "message": { "content": "" },  // Empty!
    "finish_reason": "length"
  }],
  "usage": {
    "completion_tokens": 200,
    "completion_tokens_details": {
      "reasoning_tokens": 200  // All tokens used for reasoning!
    }
  }
}
```

**Solution:**
Set `max_completion_tokens` high enough for BOTH reasoning AND visible output:
- ❌ 200 tokens: Often results in empty content
- ✅ 800+ tokens: Allows reasoning + visible output

**Code Updates:**
```typescript
// app/services/openai.service.ts
max_tokens: 800  // Increased for GPT-5: reasoning tokens + visible output

// app/composables/useAIChat.ts  
max_tokens: 800  // Increased for GPT-5: reasoning tokens + visible output
```

This is now handled automatically in the codebase (as of this update).


### 🔧 THE ACTUAL FIX: reasoning_effort Parameter

**The Real Problem:** GPT-5 Nano uses excessive reasoning even for simple tasks.

Even with 800+ tokens, GPT-5 Nano can use ALL tokens for internal reasoning, leaving nothing for the actual response. The token limit alone is NOT enough.

**The Solution: reasoning_effort='low'**

```typescript
// REQUIRED for GPT-5 and o-series models
if (model.includes('gpt-5') || model.includes('o1') || model.includes('o3')) {
  params.reasoning_effort = 'low'  // Prevents excessive reasoning
}
```

**What reasoning_effort does:**
- `'low'`: Minimal reasoning, fast responses (RECOMMENDED for chat/customer service)
- `'medium'`: Balanced reasoning and output
- `'high'`: Maximum reasoning (can consume all tokens, causing empty responses)
- Default: Medium-High (problematic for simple prompts)

**Why this happens:**
- GPT-5 Nano is optimized for classification and summarization
- For simple conversational tasks, it over-thinks and uses all tokens for reasoning
- Setting `reasoning_effort='low'` tells the model to prioritize output over reasoning

**References:**
- [Microsoft Q&A: GPT-5-nano returns empty response](https://learn.microsoft.com/en-us/answers/questions/5590694/ai-foundry-model-gpt-5-nano-returns-empty-response)
- [OpenAI Community: What is going on with GPT-5 API?](https://community.openai.com/t/what-is-going-on-with-the-gpt-5-api/1338030)
- [GitHub: gpt-5-mini returns empty output_text](https://github.com/openai/openai-python/issues/2546)

**This fix is now implemented in `openai.service.ts` automatically.**

