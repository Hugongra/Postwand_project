import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import fs from 'fs'
import svgr from 'vite-plugin-svgr'

export default defineConfig({
  plugins: [
    react(),
    svgr()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "~public": path.resolve(__dirname, "./public"),
    },
  },
  server: {
    host: '0.0.0.0',  // Listen on all interfaces
    port: 5173,
    https: {
      key: fs.readFileSync('../localhost+3-key.pem'),  // Multi-domain certificate key
      cert: fs.readFileSync('../localhost+3.pem'),     // Multi-domain certificate
    },
    proxy: {
      '/api': {
        target: 'https://localhost:5001',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  publicDir: 'public'
})


