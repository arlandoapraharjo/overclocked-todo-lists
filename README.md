# Overclocked To-Do List

[![React Version](https://img.shields.io/badge/React-19-blue?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7%2B-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2%2B-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Motion](https://img.shields.io/badge/Motion-v12-black?logo=framer&logoColor=white)](https://motion.dev/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

An overengineered management dashboard to meet my needs because I don't find any suitable replacement app for it.

This app has two view modes: **Unified List** and an interactive **Tasks Bento Widget**. With **Brain Dump** feature that extracts discrete tasks, auto-assigns domains, sets durations, and prioritizes by urgency from unstructured text or audio (wip).

---

## Key Features

- **Dual View Modes:**
  - **Unified List:** A clean, high-speed vertical task list featuring drag-and-drop reordering, instant completion with celebratory confetti (`canvas-confetti`), urgency indicators, and swipe deletion.
  - **Tasks Bento Widget:** An interactive categorized dashboard where widgets smoothly slide out of the way in real time as you drag across grid slots, snapping tactilely into place upon release.
- **AI Brain Dump Engine:**
  - Extracts discrete tasks, auto-assigns domains (`Work`, `Personal`, `Design`, `Urgent`, `General`), sets durations, and prioritizes by urgency from unstructured text or audio notes (wip).
  - Supports direct client-side browser connections to Google Gemini, OpenAI, and Anthropic Claude, plus an offline heuristic fallback requiring zero API keys.
- **Animated Pattern Cloud Shader:**
  - High-performance WebGL background featuring procedural terrain noise, neon topographic lines, and sand-ripple wavy motion.
- **Theme Transitions:**
  - Dark and Light mode support with hardware-accelerated fade transitions across the UI and shader color uniforms.
- **Command Palette (`⌘K` / `Ctrl+K`):**
  - Spotlight-style keyboard navigation for rapid task filtering, view toggling, batch actions, and configuration.
- **Client-Side Privacy First:**
  - Direct browser-to-provider API calls. No intermediary proxy or logging servers storing your tasks or keys.
  - Flexible key persistence: keep keys in memory for the active session or save with XOR-masking locally with a one-click panic wipe.

---

## Security & Architecture Principles

Designed with client-side zero-trust security and defense-in-depth:

- **Direct API Authentication:** 
  - Direct client requests to official endpoints (`Google AI Studio`, `OpenAI`, `Anthropic`).
  - Gemini API keys are sent via the `x-goog-api-key` HTTP header rather than URL query parameters to avoid exposure in proxy logs and browser history.
- **Prompt Injection Defense & Structural Bounding:**
  - Raw inputs are bounded inside `<untrusted_user_input>` XML tags with explicit defensive system prompts prohibiting role overrides or instruction hijacking.
  - Strict input limits: 4,000-character payload cap, control character stripping, and bidirectional Unicode override neutralization.
- **Output Sanitization & Anti-XSS:**
  - All parsed titles, estimated times, and categories are filtered against HTML injection and `javascript:` pseudo-protocols before entering state.
- **Credential Storage Policies:**
  - **Session Only (Default):** Stores keys in memory / `sessionStorage`, auto-purged on tab close.
  - **Remember on Device:** Stores keys with XOR-mask obfuscation in local storage to prevent plain-text discovery in storage inspection.
  - **Instant Zeroing:** One-click panic button to immediately wipe all credentials across both storage tiers.
- **Strict Content Security Policy (CSP):**
  - `connect-src` restricted to `self` and official AI provider endpoints (`generativelanguage.googleapis.com`, `api.openai.com`, `api.anthropic.com`).
  - Strict defense headers (`X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and `rel="noopener noreferrer"`).

---

## Project Structure

```text
├── index.html                  # Strict CSP & defense-in-depth security meta tags
├── src/
│   ├── components/
│   │   ├── AISettingsModal.tsx      # Credential management, storage policies & wipe action
│   │   ├── AnimatedPatternCloud.tsx # WebGL topographic neon wavy shader background
│   │   ├── CommandPalette.tsx       # Global ⌘K spotlight interface
│   │   ├── FilterBar.tsx            # Status & category filter pill bar
│   │   ├── Header.tsx               # Dynamic greeting, progress indicator & view switcher
│   │   ├── TaskInput.tsx            # Dual single/batch input with character counters & Brain Dump
│   │   ├── TodoItem.tsx             # Compact list item with motion drag controls & animations
│   │   └── WidgetGrid.tsx           # Tasks Bento Widget with dynamic tiling & drop snap
│   ├── hooks/
│   │   └── useTodos.ts              # Persistent task state, filtering & batch operations
│   ├── services/
│   │   ├── aiParser.ts              # Multi-provider task extractor with prompt injection defense
│   │   └── aiSettings.ts            # Secure credential storage & obfuscation utilities
│   ├── types/
│   │   └── todo.ts                  # Domain models (Todo, Priority, Category, FilterStatus)
│   ├── index.css                    # Tailwind CSS v4 design tokens & theme transitions
│   └── main.tsx                     # React 19 entrypoint
├── .env.example                # Safe environment variable template
└── .gitignore                  # Production Git exclusions (.env, node_modules, dist)
```

---

## Getting Started

### Prerequisites

- **Node.js 20.0.0 or higher** (required by Tailwind CSS v4 and its native engine)
- npm, pnpm, or yarn

### 1. Clone & Install

```bash
# Clone the repository
git clone https://github.com/arlandoapraharjo/overclocked-todo-lists.git
cd overclocked-todo-lists

# Install dependencies
npm install
```

### 2. Configure Environment (Optional)

API keys can be supplied directly through the in-app **AI Settings Modal** (`⌘K` → `AI Settings` or click the Brain Dump trigger).

Alternatively, you can copy the environment template for local development:

```bash
cp .env.example .env.local
```

### 3. Run Development Server

```bash
npm run dev
# or: npm start
```

Visit `http://localhost:5173` in your browser.

> [!TIP]
> **Troubleshooting Native Bindings (`@tailwindcss/oxide`)**:
> If npm encounters bug [npm/cli#4828](https://github.com/npm/cli/issues/4828) skipping native binary bindings on fresh clones, force-install your platform binary:
> - **Windows**: `npm install @tailwindcss/oxide-win32-x64-msvc --save-dev --force`
> - **macOS**: `npm install @tailwindcss/oxide-darwin-arm64 --save-dev --force` (or `darwin-x64`)
> - **Linux**: `npm install @tailwindcss/oxide-linux-x64-gnu --save-dev --force`
> Or simply perform a clean reinstall: `rm -rf node_modules package-lock.json && npm install`.

### 4. Build for Production

```bash
npm run build
```

The optimized static production bundle will be generated in `dist/`.

---

## Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `⌘K` / `Ctrl+K` | Open Spotlight Command Palette |
| `Enter` | Focus / Expand quick task input |
| `⌘Enter` / `Ctrl+Enter` | Execute AI Brain Dump task extraction |
| `Esc` | Close modals / cancel active task creation |

---

## Design References & Acknowledgments

- **Animated Pattern Cloud** WebGL shader background by [@ashishrajwaniai01](https://21st.dev/@ashishrajwaniai01).
- Interactive drag-and-drop primitives inspired by [@0xUrvish](https://21st.dev/@0xUrvish) and [@ddoemonn](https://21st.dev/@ddoemonn).
- Vanishing task micro-interactions inspired by [@uniquesonu](https://21st.dev/@uniquesonu).
- Draggable Bento Widget Grid concept inspired by [@carolinaraulino](https://21st.dev/@carolinaraulino).

---

## Author & License

- Built by **[arlandoapraharjo](https://github.com/arlandoapraharjo)**
- Repository: **[overclocked-todo-lists](https://github.com/arlandoapraharjo/overclocked-todo-lists)**
- Distributed under the [MIT License](LICENSE).
