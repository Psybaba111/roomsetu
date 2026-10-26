#!/usr/bin/env node
/**
 * Nitro bundles @electric-sql/pglite into the Vercel function, but the runtime
 * still loads pglite.data / pglite.wasm / initdb.wasm via import.meta.url next
 * to that bundle. Copy them into the function `_libs` dir after `vite build`.
 * No-op when the server output is missing (typecheck-only trees, failed builds).
 */
import { copyFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = join(root, "node_modules/@electric-sql/pglite/dist");
const destDir = join(root, ".vercel/output/functions/__server.func/_libs");
const files = ["pglite.data", "pglite.wasm", "initdb.wasm"];

try {
  await mkdir(destDir, { recursive: true });
  await Promise.all(files.map((name) => copyFile(join(srcDir, name), join(destDir, name))));
  console.log(`[pglite] copied ${files.join(", ")} → ${destDir}`);
} catch (err) {
  if (err && typeof err === "object" && "code" in err && err.code === "ENOENT") {
    console.log("[pglite] server output missing, skip asset copy");
  } else {
    throw err;
  }
}
