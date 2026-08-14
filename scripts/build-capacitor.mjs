// Cross-platform Capacitor build (Windows, macOS, Linux).
// Replaces the old Unix-only shell one-liner.
//
// Behavior preserved:
//   - CAPACITOR=1
//   - VITE_API_BASE_URL defaults to https://connection-context-coach.lovable.app
//   - runs `vite build`
//   - copies dist/client/_shell.html -> dist/client/index.html when present,
//     otherwise requires dist/client/index.html to already exist
//   - verifies the compiled bundle does not contain an unexpanded URL placeholder
//   - runs `cap sync` so Android/iOS receive the freshly built web assets
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, readFileSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";

const DEFAULT_API_BASE = "https://connection-context-coach.lovable.app";

function validApiBase(value) {
  const candidate = (value || "").trim().replace(/\/$/, "");
  if (!candidate || candidate.includes("${") || candidate.includes("%")) return "";
  try {
    const url = new URL(candidate);
    return url.protocol === "https:" || url.protocol === "http:" ? url.origin : "";
  } catch {
    return "";
  }
}

function filesBelow(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const location = path.join(directory, entry.name);
    return entry.isDirectory() ? filesBelow(location) : [location];
  });
}

const suppliedApiBase = process.env["VITE_API_BASE_URL"];
const apiBase = validApiBase(suppliedApiBase) || DEFAULT_API_BASE;
if (suppliedApiBase && !validApiBase(suppliedApiBase)) {
  console.warn("[build:capacitor] ignored invalid VITE_API_BASE_URL and used the published URL");
}

const clientDir = path.join(process.cwd(), "dist", "client");
const viteCli = path.join(process.cwd(), "node_modules", "vite", "bin", "vite.js");
const capacitorCli = path.join(process.cwd(), "node_modules", "@capacitor", "cli", "bin", "capacitor");

if (!existsSync(viteCli) || !existsSync(capacitorCli)) {
  console.error("[build:capacitor] dependencies are missing. Run `bun install` in the project folder, then try again.");
  process.exit(1);
}

rmSync(clientDir, { recursive: true, force: true });

const result = spawnSync(process.execPath, [viteCli, "build"], {
  stdio: "inherit",
  shell: false,
  env: { ...process.env, CAPACITOR: "1", VITE_API_BASE_URL: apiBase },
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

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

const textAssets = filesBelow(clientDir).filter((file) => /\.(?:html|js|css|json)$/i.test(file));
const badAsset = textAssets.find((file) => readFileSync(file, "utf8").includes("${VITE_API_BASE_URL"));
if (badAsset) {
  console.error(`[build:capacitor] unexpanded VITE_API_BASE_URL found in ${badAsset}`);
  process.exit(1);
}

const sync = spawnSync(process.execPath, [capacitorCli, "sync"], {
  stdio: "inherit",
  shell: false,
});
if (sync.status !== 0) {
  process.exit(sync.status ?? 1);
}

console.log(`[build:capacitor] built and synced. VITE_API_BASE_URL=${apiBase}`);
