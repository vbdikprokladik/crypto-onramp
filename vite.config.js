import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // некоторые solana-зависимости ожидают наличия global
    global: 'globalThis'
  },
  server: {
    port: 3000
  }
});
