# Link Snippet Copier (Chrome + Firefox)

This WebExtension adds three actions to copy page information using your provided snippets:

- Markdown link: `[title](url)`
- Org-mode link: `[[url][title]]`
- Frontmatter block with title/date/url fields

## Load in Chrome

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select the `src` directory.

## Load in Firefox

1. Open `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on...**
3. Select `manifest.json` from an unzipped Firefox package folder.

## Usage

Use any of these entry points:

- Extension popup buttons
- Right-click context menu on a page
- Keyboard shortcuts:
  - `Alt+Shift+1` Markdown
  - `Alt+Shift+2` Org-mode
  - `Alt+Shift+3` Frontmatter
  - macOS defaults: `Ctrl+Shift+1`, `Ctrl+Shift+2`, `Ctrl+Shift+3`

The extension copies all formats directly to clipboard. If copying fails, it shows an error message.

## Generate Icons

Run:

```bash
node scripts/generate-icons.js
```

This creates:

- `src/icons/icon-16.png`
- `src/icons/icon-32.png`
- `src/icons/icon-48.png`
- `src/icons/icon-128.png`

## Build Packages

Run:

```bash
./scripts/package.sh
```

This creates:

- `dist/link-snippet-copier-chrome.zip`
- `dist/link-snippet-copier-firefox.xpi`

The Firefox package is built with a compatibility manifest that uses `background.scripts` for environments where `background.service_worker` is disabled.

## GitHub Actions Build

Workflow file: `.github/workflows/build-packages.yml`

It runs only on manual trigger (`workflow_dispatch`) and asks for a required `version` input (for example `0.2.0`). The workflow sets this value in `src/manifest.json`, builds, and uploads:

- `dist/link-snippet-copier-chrome.zip`
- `dist/link-snippet-copier-firefox.xpi`
