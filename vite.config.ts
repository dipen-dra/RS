import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

const excludeDeps = [
  "@tanstack/react-start",
  "@tanstack/react-start-client",
  "@tanstack/react-start-server",
  "@tanstack/start-client-core",
  "@tanstack/start-server-core",
];

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    tanstackStart({
      server: { entry: "src/server.ts" },
    }),
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5001",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  optimizeDeps: {
    exclude: excludeDeps,
  },
  ssr: {
    optimizeDeps: {
      exclude: excludeDeps,
    },
  },
  environments: {
    client: {
      optimizeDeps: {
        exclude: excludeDeps,
      },
    },
    ssr: {
      optimizeDeps: {
        exclude: excludeDeps,
      },
    },
    tanstack_start_app: {
      optimizeDeps: {
        exclude: excludeDeps,
      },
    },
  },
});
