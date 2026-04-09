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
      "@components": path.resolve(__dirname, "./src/components"),
      "@services": path.resolve(__dirname, "./src/services"),
    },
  },
  server: {
    host: '0.0.0.0',  // Listen on all interfaces
    port: 5174,  // Changed port to avoid conflicts
    https: {
      key: fs.readFileSync('../https_certs/localhost+3-key.pem'),  // Multi-domain certificate key
      cert: fs.readFileSync('../https_certs/localhost+3.pem'),     // Multi-domain certificate
    },
    proxy: {
      '/api': {
        target: 'https://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
      },
    },
  },
  publicDir: 'public'
})


