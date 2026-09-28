import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// Mock UI dev server: forces VITE_MOCK_UI so the client never depends on shell env.
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: {},
    "import.meta.env.VITE_MOCK_UI": JSON.stringify("true"),
  },
  envDir: "../../../../",
})
