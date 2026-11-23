import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // 로컬 네트워크(동일 Wi-Fi) 모바일 기기 접속 지원
    port: 3000
  }
});
