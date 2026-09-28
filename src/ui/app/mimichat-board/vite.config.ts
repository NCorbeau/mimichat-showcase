import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: {},
    // Board must not pick up VITE_MOCK_UI from the repo root .env (used for main dev:mock),
    // or real boards show mock data (e.g. "Board standup"). Opt in with VITE_MOCK_UI_BOARD=true.
    "import.meta.env.VITE_MOCK_UI": JSON.stringify(
      process.env.VITE_MOCK_UI_BOARD === "true" ? "true" : ""
    ),
  },
  envDir: "../../../../",
  server: {
    port: 5174
  }
})

// import { defineConfig } from 'vite'
// import { fileURLToPath } from 'url'
// import react from '@vitejs/plugin-react-swc'

// // https://vitejs.dev/config/
// export default defineConfig({
//   plugins: [react()],
//   define: {
//     global: {}
//   },
//   build: {
//     rollupOptions: {
//       input: {
//         main: fileURLToPath(new URL('./src/ui/app/mimichat-main/index.html', import.meta.url)),
//         board: fileURLToPath(new URL('./src/ui/app/mimichat-board/index.html', import.meta.url))
//       },
//       output: {
//         preserveModules: false
//       }
//     }
//   }
// })
