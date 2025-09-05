#!/usr/bin/env bun

import { $ } from "bun";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";

async function build() {
  console.log("🔨 Building pql-ci-cd...");

  // Create dist directory if it doesn't exist
  if (!existsSync("src/dist")) {
    mkdirSync("src/dist", { recursive: true });
  }

  // Build the main file
  const result = await Bun.build({
    entrypoints: ["./src/index.ts"],
    outdir: "./src/dist",
    target: "node",
    format: "esm",
    minify: false,
    sourcemap: "external",
  });

  if (!result.success) {
    console.error("❌ Build failed:");
    for (const message of result.logs) {
      console.error(message);
    }
    process.exit(1);
  }

  // Create executable script
  const executableScript = `#!/usr/bin/env node
import("./index.js").then(({ main }) => main()).catch(console.error);
`;

  writeFileSync(join("src/dist", "cli.js"), executableScript);

  // Make it executable
  await $`chmod +x src/dist/cli.js`;

  console.log("✅ Build completed successfully!");
  console.log("📦 Output files:");
  console.log("  - src/dist/index.js");
  console.log("  - src/dist/cli.js (executable)");
}

if (import.meta.main) {
  build().catch(console.error);
}
