import path from "node:path";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const extraHosts = (env.VITE_ALLOWED_HOSTS ?? "")
    .split(",")
    .map((host) => host.trim())
    .filter(Boolean);

  return {
    plugins: [vue(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      host: true,
      port: 5173,
      // Erlaubt das Testen ohne Deployment ueber einen Cloudflare Quick Tunnel
      // (Hosts wie *.trycloudflare.com). Eigene Tunnel-Domains via
      // VITE_ALLOWED_HOSTS (kommagetrennt) ergaenzen.
      allowedHosts: [".trycloudflare.com", ...extraHosts],
    },
  };
});
