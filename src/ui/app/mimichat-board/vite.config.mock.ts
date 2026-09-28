import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { fileURLToPath } from "node:url";

const mockChat = fileURLToPath(new URL("../../../app/chatMock.ts", import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@chat': mockChat } },
  define: {
    global: {},
    "import.meta.env.VITE_MOCK_UI": JSON.stringify("true"),
  },
  envDir: "../../../../",
  publicDir: "../../../../public",
  server: {
    port: 5174,
  },
});
