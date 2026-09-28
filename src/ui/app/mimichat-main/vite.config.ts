import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { fileURLToPath } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@chat': fileURLToPath(new URL('../../../app/chat.ts', import.meta.url)) } },
  define: {
    global: {},
    "import.meta.env.VITE_MOCK_UI": JSON.stringify(process.env.VITE_MOCK_UI ?? ""),
  },
  envDir: "../../../../",
})
