import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'اقرأ | Iqraa', 
        short_name: 'اقرأ', 
        description: 'تطبيق إسلامي شامل يحتوي على القرآن، الأذكار، التسميع، مواقيت الصلاة، والقبلة.',
        theme_color: '#D4A373',
        background_color: '#FDFBF7',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: '/logo-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/logo-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            // كاش لـ API القرآن (النصوص)
            urlPattern: /^https:\/\/api\.alquran\.cloud\/v1\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'quran-text-cache',
              expiration: {
                maxEntries: 114, // عدد سور القرآن
                maxAgeSeconds: 60 * 60 * 24 * 365 // سنة كاملة
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
