# Overclocked To-Do List — High-Performance Minimalist Bento Task Engine

[![React Version](https://img.shields.io/badge/React-19-blue?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7%2B-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2%2B-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Motion](https://img.shields.io/badge/Motion-v12-black?logo=framer&logoColor=white)](https://motion.dev/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

An overengineered, state-of-the-art task management dashboard combining dual presentation engines: a high-efficiency **Unified Vanishing List** and an interactive **2D Magnetic Bento Widget Canvas**. Equipped with an **AI Brain Dump Engine** that extracts discrete tasks, auto-assigns domains, computes durations, and prioritizes by urgency from unstructured paragraphs or meeting notes.

Built with design inspiration from curated **21st.dev** component architectures (`@uniquesonu/animated-to-do-list`, `@0xUrvish/list-item`, `@ddoemonn/reorder-list`, `@carolinaraulino/draggable-widget-grid`).

---

## Key Features

- **Dual View Modes:**
  - **Unified Vanish List:** Drag-and-drop reordering, interactive check-off with particle burst celebration (`canvas-confetti`), dynamic urgency dots, and swipe deletion.
  - **2D Magnetic Bento Canvas:** Freely draggable categorized widgets bounded within viewport constraints, with Euclidean-distance slot detection and magnetic spring snapping.
- **AI Brain Dump Ingestion:** Multi-provider API integration (Google Gemini, OpenAI GPT-4o-mini, Anthropic Claude 3.5 Haiku) with smart offline heuristic NLP fallback (instant, zero keys required).
- **Automated Urgency Sorting:** Tasks are intelligently ranked (`High` → `Medium` → `Low`) and partitioned across functional domains (`Work`, `Personal`, `Design`, `Urgent`, `General`).
- **Spotlight Command Palette (`⌘K` / `Ctrl+K`):** Instant search, quick priority filtering, category switching, and view toggles.
- **Aesthetic Ergonomics:** Dark/light mode auto-sync, Geist & Geist Mono typography, curated slate/zinc color tokens, and 100% clean Lucide vector icons (zero unicode emoji pollution).

---

## Security & Cyber-Defense Hardening

Designed with client-side zero-trust security and defense-in-depth principles:

- **Header-Based Direct API Authentication:** 
  - Direct browser-to-provider requests (`Google AI Studio`, `OpenAI`, `Anthropic`). No intermediary proxy or logging server.
  - Gemini API keys are sent via the `x-goog-api-key` HTTP header rather than URL query parameters to prevent leakage in browser history, proxy logs, and referrers.
- **Prompt Injection Defense & Structural Isolation:**
  - Raw inputs are bounded inside `<untrusted_user_input>` XML tags with explicit defensive system prompts prohibiting instruction hijacking or role overrides.
  - Enforces strict input validation: 4,000-character payload cap, control character stripping, and bidirectional Unicode override neutralization.
- **Output Sanitization & Anti-XSS:**
  - All parsed titles, estimated times, and categories are filtered against HTML tag injections, `javascript:` pseudo-protocols, and inline triggers before entering state.
- **Client Credential Storage Policy:**
  - **Session Only (Default):** Stores keys exclusively in memory / `sessionStorage`, auto-purged the moment the browser tab is closed.
  - **Remember on Device:** Stores keys with XOR-mask obfuscation in local storage to prevent plain-text exposure in storage dumps.
  - **Instant Zeroing:** One-click panic button to wipe all credentials across both storage tiers immediately.
- **Content Security Policy (CSP) & Defense Headers:**
  - Strict `connect-src` limited to `self` and official AI provider endpoints (`generativelanguage.googleapis.com`, `api.openai.com`, `api.anthropic.com`).
  - Added `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and `rel="noopener noreferrer"` on all external links.

---

## Architecture & Project Structure

```text
├── index.html                  # Strict CSP & defense-in-depth security meta tags
├── src/
│   ├── components/
│   │   ├── AISettingsModal.tsx # Credential management, storage policies & wipe action
│   │   ├── CommandPalette.tsx  # Global ⌘K spotlight interface
│   │   ├── FilterBar.tsx       # Status & category filter pill bar
│   │   ├── Header.tsx          # Dynamic greeting, progress bar & view switcher
│   │   ├── TaskInput.tsx       # Dual single/batch input with character counters & XSS defenses
│   │   ├── TodoItem.tsx        # Compact list item with motion drag controls & animations
│   │   └── WidgetGrid.tsx      # 2D bounded free-draggable canvas with magnetic grid snapping
│   ├── hooks/
│   │   └── useTodos.ts         # Persistent task state & batch operations
│   ├── services/
│   │   ├── aiParser.ts         # Multi-provider task extractor with prompt injection defense
│   │   └── aiSettings.ts       # Secure credential storage & obfuscation utilities
│   ├── types/
│   │   └── todo.ts             # Domain models (Todo, Priority, Category, FilterStatus)
│   ├── index.css               # Tailwind CSS v4 design tokens & GPU-composited styling
│   └── main.tsx                # React 19 entrypoint
├── .env.example                # Safe environment variable template
└── .gitignore                  # Production Git exclusions (.env, node_modules, dist)
```

---

## Getting Started

### Prerequisites

- Node.js 18.0.0 or higher
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

API keys can be supplied directly through the in-app **AI Settings Modal** (`⌘K` → `AI Settings` or click the AI Import button).

Alternatively, you can copy the environment template for local development:

```bash
cp .env.example .env.local
```

### 3. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:5173` in your browser.

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
| `Enter` | Expand quick task input |
| `⌘Enter` / `Ctrl+Enter` | Execute AI Brain Dump task extraction |
| `Esc` | Close modals / cancel active task creation |

---

## Design References & Acknowledgments

- Interactive drag-and-drop primitives inspired by [@0xUrvish](https://21st.dev/@0xUrvish) and [@ddoemonn](https://21st.dev/@ddoemonn).
- Vanishing task micro-interactions inspired by [@uniquesonu](https://21st.dev/@uniquesonu).
- Draggable Bento Widget Grid concept inspired by [@carolinaraulino](https://21st.dev/@carolinaraulino).

---

## License

Distributed under the [MIT License](LICENSE).
