import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import legacyCssPlugin from './vite-plugin-legacy-css'
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), legacyCssPlugin()],
  build: {
    target: ['es2018', 'chrome61'],
    cssTarget: 'chrome61',
  },
  css: {
    lightningcss: {
      targets: {
        chrome: (61 << 16),
        edge: (79 << 16),
        firefox: (60 << 16),
        safari: (11 << 16),
      },
    },
  },
})
