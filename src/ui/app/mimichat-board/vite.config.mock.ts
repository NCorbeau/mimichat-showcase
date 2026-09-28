import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// Mock UI for board: same as main mock, but board entry uses VITE_MOCK_UI_BOARD in default config.
export default defineConfig({
  plugins: [react()],
  define: {
    global: {},
    "import.meta.env.VITE_MOCK_UI": JSON.stringify("true"),
  },
  envDir: "../../../../",
  server: {
    port: 5174,
  },
});
