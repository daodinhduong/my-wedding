export default defineNuxtConfig({
  compatibilityDate: '2026-06-16',
  devtools: { enabled: true },
  modules: ['@nuxt/eslint'],
  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL || 'postgres://nuxt:nuxt@localhost:5432/nuxt_app',
    public: {
      appName: 'Nuxt 4 SQL Docker'
    }
  },
  nitro: {
    preset: 'node-server'
  }
})
