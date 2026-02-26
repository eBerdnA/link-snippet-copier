#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const inputPath = path.join(__dirname, "..", "src", "manifest.json");
const outputPath = path.join(__dirname, "..", "dist", ".tmp-firefox", "manifest.json");

const manifest = JSON.parse(fs.readFileSync(inputPath, "utf8"));

manifest.background = {
  scripts: ["background.js"]
};

manifest.permissions = Array.from(
  new Set([...(manifest.permissions || []).filter((p) => p !== "scripting"), "tabs"])
);

fs.writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`);
process.stdout.write(`Wrote Firefox manifest to ${outputPath}\n`);
