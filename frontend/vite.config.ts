import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  server: {
    port: 12000,
  },
  plugins: [tailwindcss(), vue()],
  define: {
    process: {
      env: {
        BACKEND_URL: process.env.BACKEND_URL,
      },
    },
  },
});
