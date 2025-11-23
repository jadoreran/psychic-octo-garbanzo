// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  runtimeConfig: {
    public: {
      OPENAI_API_KEY: process.env.NUXT_PUBLIC_OPENAI_API_KEY,
      OPENAI_MODEL: process.env.NUXT_PUBLIC_OPENAI_MODEL,
      OPENAI_ORG_ID: process.env.NUXT_PUBLIC_OPENAI_ORG_ID
    }
  }
})
