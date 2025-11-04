# Parser Config Builder — Architecture

This document describes the architecture, modules, messaging flows, and build targets of the Chrome/Chromium WebExtension used to build JSON parser configs from any manga/comics sites.

## High‑level overview
- Manifest V3 extension with the following entrypoints:
  - background service worker (lifecycle, commands, icon state, tab events)
  - content script (DOM interaction, element selection, schema/config logic, sidebar UI)
  - popup (user control surface: activate/toggle, quick selection)
- Messaging flows:
  - popup → content: user actions (ACTIVATE_EXTENSION, START_SELECTION, DEACTIVATE_EXTENSION)
  - content → sidebar (in‑page DOM interactions + notifications)
  - background ↔ content: auxiliary interactions (badge, temp data, tab info)
- Build: Vite + TS strict, MV3 compliant, outputs to dist/ with stable asset names for manifest.

## Modules

### 1) Background (src/background/background.ts)
Responsibilities:
- Listen to lifecycle events: onInstalled, onStartup
- Track active tab (tabs.onActivated, tabs.onUpdated)
- Handle commands (chrome.commands: toggle‑extension, quick‑select)
- Set action icon state (active/inactive)
- Bridge messaging when needed (optional)

Key methods:
- handleMessage(message): MessageResponse
- toggleExtension(): send ACTIVATE/DEACTIVATE to active tab
- startQuickSelect(): send START_SELECTION to active tab
- updateIcon(tabId, isActive): setIcon safe with fallback

### 2) Content Script (src/content/content-script.ts)
Responsibilities:
- DOM integration and in‑page UI
- Element selection flow (hover/click/keys)
- Config lifecycle: create, load, save, test
- Messaging handler for popup/background

Key collaborators:
- ElementSelector (src/content/element-selector.ts)
- ConfigSidebar (src/content/config-sidebar.ts)
- Selector utils (src/utils/selector.ts)

Key methods (content‑script):
- handleActivate/handleDeactivate
- handleStartSelection/handleStopSelection
- handleTestConfig/handleHighlightElement
- initializeConfig/createDefaultConfig
- testConfigOnPage/extractValueFromElement

### 3) Popup (src/popup/popup.ts + src/popup/popup.html)
Responsibilities:
- Surface minimal UI to activate/deactivate and start ‘quick select’
- Show current domain and support state
- Send messages to active tab’s content script

Key flows:
- Toggle → ACTIVATE/DEACTIVATE_EXTENSION
- Quick select → START_SELECTION(fieldName=quick_select)

### 4) Types and Messaging (src/types/*, src/utils/messaging.ts)
- ExtensionMessage union with guards (e.g., ACTIVATE_EXTENSION, START_SELECTION, ...)
- MessageResponse { success, data?, error? }
- messaging.ts provides:
  - sendMessageToContentScript(message)
  - sendMessageToBackground(message)
  - broadcastMessage(message)

### 5) Assets and Styling
- content-script.css imported by content‑script.ts for stable output name
- popup.css for popup UI styling
- icons/ with default and active variants (16/32/48/128)

## Messaging Contracts

- ACTIVATE_EXTENSION → content → show sidebar, add body.pcb-active
- DEACTIVATE_EXTENSION → content → hide sidebar, clear highlights
- START_SELECTION(fieldName, fieldType) → content → ElementSelector.startSelection
- HIGHLIGHT_ELEMENT(selector) → content → highlightBySelector
- TEST_CONFIG(config) → content → testConfigOnPage → sidebar.notifyTestResults
- SAVE_CONFIG(config) → content → validate + chrome.storage.local.set

## Error Handling & CSP
- content script uses safe style injection + separate content-script.css
- UI renders in DOM with pcb-ui class to avoid interference
- If CSP blocks inline CSS/JS on target, use chrome.scripting.insertCSS as fallback (future enhancement)

## Build Targets
- dev: vite build --mode development (sourcemaps on, unminified)
- prod: vite build (optimized)
- dist/ is the only loadable path for chrome://extensions ‘Load unpacked’

---

# Parser Config Builder — Functional Spec

This document outlines the scope of features and expected behaviors.

## MVP Scope (current)
- Activate/deactivate extension per tab
- Right sidebar with instructions and status
- Element selection with hover/confirm/cancel (ESC/Enter)
- Selector generation (data‑attributes, semantic, id, class, tag, xpath, position, text‑content)
- Save/load config per domain to chrome.storage.local
- Quick test of selectors against current page

## Future Scope
- React‑based sidebar with schema editor
- Field mapping and required/optional controls
- JSON export/import workflows
- Multi‑page workflows and site profiles
- Firefox build via webextension‑polyfill

## UX Details
- Activation adds body.pcb-active and shows sidebar
- Hover: purple outline, Select: green outline, Info toast appears
- Notifications stack near sidebar; auto‑dismiss after 4s
- History lists last 10 selections with truncated CSS selector

## Non‑Functional
- TS strict (with sensible suppressions where necessary)
- Manifest V3 compliant, Chromium family first, FF later
- Minimal permissions: activeTab, storage, scripting

---

# Repository Working Rules

## Branches
- main: stable
- development: active work
- feature/*: isolated features; PR back to development

## Commits
- Conventional prefix + short scope, e.g.:
  - feat(content): add element selection sidebar
  - fix(background): fallback on setIcon failure
  - chore(build): force dev build for debugging

## Build & Run
- Install: npm ci
- Dev build: npm run dev (vite build --mode development)
- Prod build: npm run build
- Load extension: chrome://extensions → Load unpacked → dist/
- Reload after every build

## Lint/Typecheck
- Typecheck: npm run type-check (tsc --noEmit)
- Keep noUnusedLocals/Parameters relaxed during active dev; re‑enable before release

## Debugging
- Open 3 consoles when testing:
  1) Page (content script console)
  2) Popup (F12 on popup window)
  3) Service Worker (chrome://extensions → Inspect)
- Enable verbose logs in popup.ts and messaging.ts (already added)

## File/Asset Rules
- Do NOT add temporary JS stubs that shadow TS outputs (e.g., src/popup/popup.js)
- Icons must exist for all sizes; active icons are optional with fallback
- content-script.css must match manifest css entry

## Release Checklist
- Build prod → npm run build
- Verify dist/ contains: manifest.json, popup.html/js/css, content-script.js/css, background.js, icons/
- Manual smoke test on 2–3 sites
