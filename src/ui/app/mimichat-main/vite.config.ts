import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: {},
    "import.meta.env.VITE_MOCK_UI": JSON.stringify(process.env.VITE_MOCK_UI ?? ""),
  },
  envDir: "../../../../",
})
