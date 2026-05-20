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
  },
});
