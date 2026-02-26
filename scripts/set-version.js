#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const inputVersion = process.argv[2];

if (!inputVersion) {
  console.error("Usage: node scripts/set-version.js <version>");
  process.exit(1);
}

if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(inputVersion)) {
  console.error(
    `Invalid version \"${inputVersion}\". Expected semver like 1.2.3 or 1.2.3-beta.1`
  );
  process.exit(1);
}

const manifestPath = path.join(__dirname, "..", "src", "manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

manifest.version = inputVersion;

fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Updated manifest version to ${inputVersion}`);
