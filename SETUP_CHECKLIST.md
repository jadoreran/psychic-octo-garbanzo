# OpenAI Integration Setup Checklist

## Quick Setup (5 minutes)

### ✅ Step 1: Get OpenAI API Key
- [ ] Go to https://platform.openai.com/api-keys
- [ ] Create account or sign in
- [ ] Click "Create new secret key"
- [ ] Copy the key (starts with `sk-proj-...`)

### ✅ Step 2: Configure Environment
- [ ] Open `.env` file in project root
- [ ] Replace `your_openai_api_key_here` with your actual key
- [ ] Save the file

### ✅ Step 3: Restart Server
```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

### ✅ Step 4: Test the Integration
- [ ] Open the chatbox in your browser
- [ ] Click the sparkle button (✨)
- [ ] Should see AI-generated Thai response suggestion
- [ ] Edit if needed and send

## File Structure Created

```
✅ .env                           # Your API key (DO NOT commit!)
✅ .env.example                   # Template for other developers
✅ app/services/openai.service.ts # OpenAI API communication
✅ app/composables/useAIChat.ts   # Vue composable for AI features
✅ app/components/ChatBox.vue     # Updated with AI button
✅ nuxt.config.ts                 # Updated with runtime config
✅ AI_INTEGRATION.md              # Full documentation
✅ SETUP_CHECKLIST.md             # This file
```

## What's New in ChatBox?

### UI Changes
- **✨ AI Button**: Left of input field, gets suggestions
- **Loading State**: Spinning icon when AI is thinking
- **Error Display**: Shows errors below input if something fails

### How to Use
1. Customer sends message
2. Click ✨ button
3. AI suggests Thai response
4. Edit suggestion if needed
5. Click → to send

## Cost Breakdown

Using **gpt-4o-mini**:
- ~$0.00015 per suggestion
- ~$0.15 per 1,000 suggestions
- Very affordable for customer service!

## Troubleshooting

### Button doesn't work?
1. Check browser console for errors
2. Verify API key in `.env`
3. Make sure you restarted server
4. Check OpenAI account has credits

### "API key is not configured"?
1. Check `.env` file exists
2. Key should be `NUXT_PUBLIC_OPENAI_API_KEY=sk-...`
3. Restart dev server

### Type errors in VS Code?
1. Save all files
2. Restart TS server: Cmd/Ctrl+Shift+P → "TypeScript: Restart TS Server"

## Next Features to Add

### Easy Wins
- [ ] Add keyboard shortcut for AI button (Cmd/Ctrl+K)
- [ ] Show multiple AI suggestions to choose from
- [ ] Add "Regenerate" button to get different suggestion

### Advanced
- [ ] Auto-detect customer sentiment and suggest tags
- [ ] Learn from your responses (fine-tuning)
- [ ] Streaming responses (typing effect)
- [ ] Conversation memory across sessions

### Production Ready
- [ ] Move API calls to server-side
- [ ] Add rate limiting
- [ ] Implement caching for common questions
- [ ] Add analytics tracking

## Security Reminder

⚠️ **IMPORTANT**:
- `.env` is in `.gitignore` - never commit it
- For production, move API calls to server-side
- Current setup is for development only

## Questions?

Read the full guide: `AI_INTEGRATION.md`

Good luck! 🚀
