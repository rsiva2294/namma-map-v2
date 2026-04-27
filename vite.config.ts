import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { sentryVitePlugin } from "@sentry/vite-plugin";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['branding/icon.png', 'branding/logo.png'],
        manifest: {
          name: 'NammaMap: Tamil Nadu Civic GIS',
          short_name: 'NammaMap',
          description: 'Find Post Offices, Ration Shops, and TNEB Offices across Tamil Nadu.',
          theme_color: '#0f172a',
          background_color: '#0f172a',
          display: 'standalone',
          icons: [
            {
              src: 'branding/icon.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'branding/icon.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: 'branding/icon.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
          // The GIS worker is quite large, ensure it can be cached
          maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/.*\.basemaps\.cartocdn\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'map-tiles-cache',
                expiration: {
                  maxEntries: 2000,
                  maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        }
      }),
      sentryVitePlugin({
        org: "sivakaminathan",
        project: "namma-map-v2",
        authToken: env.SENTRY_AUTH_TOKEN,
      })
    ],
    build: {
      sourcemap: true,
    }
  }
})
