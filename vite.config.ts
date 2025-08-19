import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  root: '.', // Keep root at project level
  server: {
    host: "::",
    port: 8080, // Restore original port for compatibility
  },
  plugins: [
    react(),
    tsconfigPaths(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: [
      // Map "@/components/ui/*" to shared shadcn directory first (more specific)
      { find: /^@\/components\/ui/, replacement: path.resolve(__dirname, "./frontend/src/shared/components/ui") },
      // NEW: map all "@/components/*" to shared/components/*
      {
        find: /^@\/components\/(.*)$/,
        replacement: path.resolve(__dirname, "./frontend/src/shared/components") + "/$1",
      },
      // map "@/services/*" to shared services
      {
        find: /^@\/services\/(.*)$/,
        replacement: path.resolve(__dirname, "./frontend/src/shared/services") + "/$1",
      },
      // Dataset paths first (more specific)
      { find: /^@\/features\/dataset\/lib/, replacement: path.resolve(__dirname, "./frontend/src/features/dataset") },
      { find: /^@\/lib\/dataset/, replacement: path.resolve(__dirname, "./frontend/src/features/dataset/lib") },
      // Quality utils (specific): "@/lib/quality/*" -> shared/lib/quality/*
      { find: /^@\/lib\/quality/, replacement: path.resolve(__dirname, "./frontend/src/shared/lib/quality") },
      // Generic lib fallback: "@/lib/*" -> shared/lib/*
      // (keep AFTER dataset mapping so dataset alias wins)
      {
        find: /^@\/lib\/(.*)$/,
        replacement: path.resolve(__dirname, "./frontend/src/shared/lib") + "/$1",
      },
      // Then map general "@/" to frontend src
      { find: /^@\//, replacement: path.resolve(__dirname, "./frontend/src") + "/" },
    ],
  },
}));