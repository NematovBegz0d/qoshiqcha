import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    server: {
      host: "0.0.0.0",
      port: 8080,
      allowedHosts: [
        ".trycloudflare.com",
        "connector-tables-reassure.ngrok-free.dev",
        ".ngrok-free.app",
        ".ngrok-free.dev",
        ".loca.lt",
      ],
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes("node_modules")) return undefined;

            if (id.includes("firebase")) return "vendor-firebase";
            if (id.includes("@tanstack")) return "vendor-tanstack";
            if (id.includes("react") || id.includes("scheduler")) return "vendor-react";
            if (
              id.includes("@radix-ui") ||
              id.includes("lucide-react") ||
              id.includes("recharts") ||
              id.includes("sonner") ||
              id.includes("vaul")
            ) {
              return "vendor-ui";
            }

            return undefined;
          },
        },
      },
    },
  },
});
