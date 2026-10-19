import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/expo-push': {
        target: 'https://exp.host',
        changeOrigin: true,
        secure: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            // Rewrite to the correct Expo push endpoint
            proxyReq.path = '/--/api/v2/push/send';
            proxyReq.setHeader('host', 'exp.host');
          });
        },
      },
    },
  },
})
