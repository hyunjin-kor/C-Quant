import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  base: "./",
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true
  },
  build: {
    target: "es2022",
    sourcemap: false,
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        // Split heavy vendor code so the main bundle stays well under budget
        // and the second paint reuses cached chunks across releases.
        manualChunks(id: string) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("react-dom") || /node_modules[\\/]react[\\/]/.test(id)) {
            return "vendor-react";
          }
          if (id.includes("lightweight-charts")) {
            return "vendor-charts";
          }
          if (id.includes("exceljs")) {
            return "vendor-exceljs";
          }
          if (id.includes("@fontsource-variable") || id.includes("@fontsource")) {
            return "vendor-fonts";
          }
          return undefined;
        }
      }
    }
  }
});
