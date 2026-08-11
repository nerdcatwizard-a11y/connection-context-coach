// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Capacitor build: `CAPACITOR=1 bun run build` produces a static, client-rendered
// SPA shell in dist/client (no per-request SSR). The nitro/Cloudflare deploy
// plugin is skipped for that build only — it emits a worker entry that the SPA
// shell prerender step can't run against. A normal `bun run build` (Lovable
// hosting) is unchanged and still SSRs.
const isCapacitorBuild = process.env["CAPACITOR"] === "1";

export default defineConfig({
  ...(isCapacitorBuild ? { nitro: false as const } : {}),
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
    // Static, client-rendered shell for the Capacitor (iOS/Android) build.
    spa: {
      enabled: isCapacitorBuild,
      // Write the shell as index.html instead of the default _shell.html,
      // since Capacitor requires the entry file to be literally named index.html.
      prerender: {
        outputPath: "/index.html",
      },
    },
  },
});