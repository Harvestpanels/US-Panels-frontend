import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(here, '..', '..')

export default defineConfig({
  root,
  plugins: [react()],
  publicDir: false,
  define: { 'process.env.NODE_ENV': '"production"' },
  resolve: {
    alias: [
      { find: 'react-router-dom', replacement: path.join(here, 'router-shim.jsx') },
      { find: /^\.\.\/utils\/appReady$/, replacement: path.join(here, 'app-ready-shim.js') },
      { find: /^\.\.\/data\/chatIcons$/, replacement: path.join(here, 'chat-icons-shim.js') },
    ],
  },
  build: {
    outDir: path.join(root, 'concept'),
    emptyOutDir: false,
    target: 'es2017',
    minify: true,
    cssCodeSplit: false,
    lib: { entry: path.join(here, 'entry.jsx'), name: 'Panelo', formats: ['iife'], fileName: () => 'js/panelo.js' },
    rollupOptions: { output: { assetFileNames: 'panelo.css' } },
  },
})
