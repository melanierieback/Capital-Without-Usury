import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig(({ command }) => {
  const isBuild = command === "build";

  // PORT is only required for the dev/preview server, not for static builds
  const rawPort = process.env.PORT;
  let port: number | undefined;
  if (!isBuild) {
    if (!rawPort) {
      throw new Error("PORT environment variable is required but was not provided.");
    }
    port = Number(rawPort);
    if (Number.isNaN(port) || port <= 0) {
      throw new Error(`Invalid PORT value: "${rawPort}"`);
    }
  }

  // BASE_PATH defaults to "/" for standalone static builds.
  // The GitHub Pages deploy sets BASE_PATH=/Capital-Without-Usury/ (must match
  // the repo name exactly; Pages paths are case-sensitive).
  const basePath = process.env.BASE_PATH ?? "/";

  return {
    base: basePath,
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "src"),
        "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
      },
      dedupe: ["react", "react-dom"],
    },
    root: path.resolve(import.meta.dirname),
    build: {
      outDir: path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,
    },
    server: {
      port,
      strictPort: true,
      host: "0.0.0.0",
      allowedHosts: true,
      fs: { strict: true },
    },
    preview: {
      port,
      host: "0.0.0.0",
      allowedHosts: true,
    },
  };
});
