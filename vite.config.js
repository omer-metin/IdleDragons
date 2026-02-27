import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: './', // CrazyGames requires relative paths
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-pixi': ['pixi.js'],
          'vendor-physics': ['matter-js'],
          'vendor-state': ['zustand'],
          'vendor-icons': ['lucide-react'],
        },
      },
    },
  },
  esbuild: mode === 'production' ? {
    drop: ['console', 'debugger'],
  } : {},
}))
