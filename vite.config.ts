import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // 상대경로로 빌드 — 하위 경로 호스팅(GitHub Pages 프로젝트 주소 등)이나
  // file:// 직접 열기에서도 자산을 찾을 수 있게 한다
  base: './',
  build: {
    outDir: 'dist',
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [],
  },
})
