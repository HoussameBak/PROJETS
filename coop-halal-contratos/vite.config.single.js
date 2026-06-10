import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";
import { renameSync, existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Inlina el favicon como data URI para no dejar ninguna referencia externa.
function inlineFavicon() {
  return {
    name: "inline-favicon",
    transformIndexHtml(html) {
      const svgPath = resolve(__dirname, "public", "favicon.svg");
      if (!existsSync(svgPath)) {
        // Sin favicon: eliminamos el link para no dejar enlaces rotos.
        return html.replace(/<link[^>]*rel="icon"[^>]*>/i, "");
      }
      const b64 = readFileSync(svgPath).toString("base64");
      const dataUri = `data:image/svg+xml;base64,${b64}`;
      return html.replace(/href="[^"]*favicon\.svg"/i, `href="${dataUri}"`);
    },
  };
}

// Build de archivo único: todo el CSS y JS embebido inline en un solo HTML.
// Salida: dist/app.html (sin carpeta assets/ ni dependencias externas).
// Pensado para enviar la app como archivo suelto por email o WhatsApp.
function renameToAppHtml() {
  return {
    name: "rename-index-to-app",
    closeBundle() {
      const dist = resolve(__dirname, "dist");
      const from = resolve(dist, "index.html");
      const to = resolve(dist, "app.html");
      if (existsSync(from)) renameSync(from, to);
    },
  };
}

export default defineConfig({
  plugins: [react(), inlineFavicon(), viteSingleFile(), renameToAppHtml()],
  build: {
    // Sin carpeta assets/: el plugin lo inlina todo, pero evitamos límites de inline.
    assetsInlineLimit: 100 * 1024 * 1024,
    chunkSizeWarningLimit: 100 * 1024 * 1024,
    cssCodeSplit: false,
  },
});
