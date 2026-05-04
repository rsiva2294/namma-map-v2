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
        registerType: 'prompt',
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
          maximumFileSizeToCacheInBytes: 3 * 1024 * 1024
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
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
                return 'vendor-react';
              }
              if (id.includes('leaflet') || id.includes('react-leaflet')) {
                return 'vendor-map';
              }
              if (id.includes('framer-motion') || id.includes('lucide-react')) {
                return 'vendor-ui';
              }
              if (id.includes('@sentry')) {
                return 'vendor-sentry';
              }
              return 'vendor-others';
            }
          }
        }
      }
    },
    test: {
      environment: 'jsdom',
      globals: true
    },
    server: {
      proxy: {
        '/eci-api': {
          target: 'https://results.eci.gov.in',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/eci-api/, ''),
          secure: false
        }
      }
    }
  }
})
