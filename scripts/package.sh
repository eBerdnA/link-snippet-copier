#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC_DIR="$ROOT_DIR/src"
DIST_DIR="$ROOT_DIR/dist"
TMP_DIR="$DIST_DIR/.tmp-package"
FIREFOX_TMP_DIR="$DIST_DIR/.tmp-firefox"

CHROME_ZIP="$DIST_DIR/link-snippet-copier-chrome.zip"
FIREFOX_XPI="$DIST_DIR/link-snippet-copier-firefox.xpi"
LEGACY_FIREFOX_ZIP="$DIST_DIR/link-snippet-copier-firefox.zip"

mkdir -p "$DIST_DIR"
rm -rf "$TMP_DIR"
rm -rf "$FIREFOX_TMP_DIR"
mkdir -p "$TMP_DIR"
mkdir -p "$FIREFOX_TMP_DIR"

node "$ROOT_DIR/scripts/generate-icons.js"

cp -R "$SRC_DIR"/* "$TMP_DIR"/
cp -R "$SRC_DIR"/* "$FIREFOX_TMP_DIR"/
node "$ROOT_DIR/scripts/build-firefox-manifest.js"

rm -f "$CHROME_ZIP" "$FIREFOX_XPI" "$LEGACY_FIREFOX_ZIP"

(
  cd "$TMP_DIR"
  zip -qr "$CHROME_ZIP" .
)

(
  cd "$FIREFOX_TMP_DIR"
  zip -qr "$FIREFOX_XPI" .
)

rm -rf "$TMP_DIR"
rm -rf "$FIREFOX_TMP_DIR"

echo "Created:"
echo "- $CHROME_ZIP"
echo "- $FIREFOX_XPI"
