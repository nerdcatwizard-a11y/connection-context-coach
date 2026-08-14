// Cross-platform Capacitor build (Windows, macOS, Linux).
// Replaces the old Unix-only shell one-liner.
//
// Behavior preserved:
//   - CAPACITOR=1
//   - VITE_API_BASE_URL defaults to https://connection-context-coach.lovable.app
//   - runs `vite build`
//   - copies dist/client/_shell.html -> dist/client/index.html when present,
//     otherwise requires dist/client/index.html to already exist
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync } from "node:fs";
import path from "node:path";

const DEFAULT_API_BASE = "https://connection-context-coach.lovable.app";

const apiBase = (process.env["VITE_API_BASE_URL"] || "").trim() || DEFAULT_API_BASE;

const result = spawnSync("vite", ["build"], {
  stdio: "inherit",
  shell: true, // resolves the local .bin shim on Windows (vite.cmd) too
  env: { ...process.env, CAPACITOR: "1", VITE_API_BASE_URL: apiBase },
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

const clientDir = path.join(process.cwd(), "dist", "client");
const shell = path.join(clientDir, "_shell.html");
const index = path.join(clientDir, "index.html");

if (existsSync(shell)) {
  copyFileSync(shell, index);
  console.log("[build:capacitor] copied _shell.html -> index.html");
} else if (existsSync(index)) {
  console.log("[build:capacitor] index.html already present");
} else {
  console.error("[build:capacitor] no dist/client/index.html or _shell.html produced");
  process.exit(1);
}

console.log(`[build:capacitor] done. VITE_API_BASE_URL=${apiBase}`);
