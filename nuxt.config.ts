export default defineNuxtConfig({
  compatibilityDate: '2026-06-16',
  devtools: { enabled: false },
  vite: {
    resolve: {
      dedupe: ['vue', '@vue/runtime-core', '@vue/runtime-dom', '@vue/reactivity', '@vue/shared']
    },
    optimizeDeps: {
      include: ['vue', 'vue-router']
    }
  },
  modules: ['@nuxt/eslint'],
  runtimeConfig: {
    r2AccountId: process.env.R2_ACCOUNT_ID || '7038d397c5a91426b229ba5922ccf48a',
    r2AccessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    r2BucketName: process.env.R2_BUCKET_NAME || 'wedding-images',
    r2PublicUrl: process.env.R2_PUBLIC_URL || 'https://pub-3395f4cf2cdf4d4f8c9fe93858d7da4a.r2.dev',
    databaseUrl: process.env.DATABASE_URL || 'postgres://nuxt:nuxt@localhost:5432/nuxt_app',
    adminPassword: process.env.ADMIN_PASSWORD || '',
    public: {
      appName: 'Nuxt 4 SQL Docker'
    }
  },
  nitro: {
    preset: 'node-server'
  }
})
