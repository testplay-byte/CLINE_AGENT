# UI Design Prompt — Project / Chat Session Screen

> **Screen ID**: 03-project-chat  
> **Screen Type**: Primary application screen  
> **Viewport**: 1440×900 (desktop), fully responsive down to mobile  
> **Application**: CLINE_AGENT — AI coding agent web application

---

## 1. Purpose & Context

This is the **primary screen** of the entire application — the screen where users spend the vast majority of their time. It is the conversational interface between the user and the AI agent, focused on a single project. Think of it as the love child of Cursor's chat panel, Claude's conversation view, and a modern terminal — but cleaner, more polished, and purpose-built for agentic coding workflows.

The user arrives here after selecting a project from the dashboard. Everything on this screen exists to serve the conversation. Panels, toolbars, and sidebars are supporting cast — the chat area is the star.

---

## 2. Design Philosophy

- **Modern & Clean**: Minimal chrome, maximum content. Every pixel earns its place.
- **Focused**: The chat is the gravitational center. Everything else recedes.
- **Alive but not distracting**: Meaningful animations (streaming text, tool progress) that inform without annoying.
- **Professional coding tool aesthetic**: Dark theme by default, precise spacing, monospace where it matters.
- **Adaptive**: Feels native at 1440px wide and at 375px narrow.
- **Accessible**: Full keyboard navigation, screen reader support, clear focus states.

---

## 3. Overall Layout — Three-Panel Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  TOP BAR (48px height, fixed)                                   │
├────────────┬──────────────────────────────────┬─────────────────┤
│            │                                  │                 │
│  LEFT      │  CENTER — CHAT AREA              │  RIGHT PANEL    │
│  SIDEBAR   │  (flex-grow, scrollable)         │  (collapsible)  │
│  250px     │                                  │  200px          │
│  (collaps- │                                  │  (collapsible)  │
│   ible)    │                                  │                 │
│            │                                  │                 │
│  File      │  Messages stream here            │  Context bar    │
│  Browser   │  Tool approval cards inline      │  Session info   │
│  + Search  │  Welcome state when empty        │  Quick actions  │
│            │                                  │                 │
├────────────┴──────────────────────────────────┴─────────────────┤
│  BOTTOM BAR — Chat Input Area (auto-expanding, ~56-180px)       │
└─────────────────────────────────────────────────────────────────┘
```

### Layout Rules
- The three columns are separated by **1px subtle borders** (not hard lines — very low opacity dividers).
- **Left sidebar** and **right panel** are independently collapsible. Their space reverts to the chat area when collapsed.
- The **top bar** and **bottom input bar** are fixed/frozen — only the center chat area scrolls.
- Total height: 100vh. No page-level scrolling — only the chat message list scrolls vertically.

---

## 4. Top Bar

**Height**: 48px  
**Background**: `#161b22`  
**Border bottom**: 1px solid `rgba(255,255,255,0.06)` with a subtle `box-shadow: 0 1px 8px rgba(0,0,0,0.3)` for depth separation.

### Layout (left to right):

**Left section**:
- **Back arrow icon** (← chevron, 20px, `#8b949e` hover → `#c9d1d9`): navigates to dashboard. Subtle hover background circle.
- **Project name** (14px, `#e6edf3`, font-weight 600, `Inter`): editable on click — transforms into an inline text input with a subtle border. Clicking away or pressing Enter saves.
- **Project path** (12px, `#8b949e`, monospace): displayed below or beside the project name in muted text. Example: `~/projects/my-web-app`. Truncated with ellipsis if too long.

**Center section**:
- **Agent status indicator**: A small dot (8px) + short text label.
  - **Idle**: Gray dot (`#8b949e`), text "Ready" — no animation.
  - **Thinking**: Calm teal pulsing dot (`#58a6ff` → `#79c0ff` pulse, 1.5s cycle), text "Thinking…" — dot has a soft radial glow.
  - **Executing tool**: Spinning teal ring (not dot — a thin ring spinner, 16px), text "Running: `tool_name`" — the tool name in monospace, slightly brighter.
  - Transitions between states are smooth 300ms fades.

**Right section** (icon buttons, 32px hit targets, 16px icons, `#8b949e` hover → `#c9d1d9`, hover bg `rgba(255,255,255,0.06)` rounded 6px):
- **Model quick-switch**: A compact dropdown/popover (not a full select). Clicking shows a floating card listing available models with:
  - Model name (e.g., "Claude 3.5 Sonnet")
  - Provider badge (e.g., "Anthropic", "OpenAI") in tiny colored pill
  - Current model has a checkmark
  - The currently selected model is shown as a small badge in the top bar (e.g., "3.5 Sonnet" in a pill).
- **New Session** button (plus icon or "New" text): starts a fresh conversation in the same project. Confirmation if current session has unsaved messages.
- **Session History** button (clock/history icon): opens a panel/dropdown showing past sessions for this project, sorted by date.
- **Settings** button (gear icon): opens a popover with quick settings (not the full settings page — just relevant ones like compact mode, auto-approve toggles).

---

## 5. Left Sidebar — File Browser

**Width**: 250px (desktop), fully collapsible  
**Background**: `#161b22`  
**Border right**: 1px solid `rgba(255,255,255,0.06)`

### Toggle Behavior
- A **toggle button** (hamburger/sidebar icon, 20px) is pinned at the left edge of the top bar or overlaid on the sidebar's top-left corner.
- Clicking toggles the sidebar between full width (250px) and collapsed (0px, fully hidden). The transition is a smooth 300ms width animation with `ease-out`.
- On tablet (640-1024px): sidebar is hidden by default and opens as a **drawer/overlay** (slides in from left with a semi-transparent backdrop).
- On mobile (<640px): sidebar is a **full-height drawer** with backdrop dismiss.

### Search Bar
- At the very top of the sidebar, below any header.
- A compact search input: `#0d1117` background, 1px border `rgba(255,255,255,0.1)`, 32px height, 12px placeholder text "Search files…" in `#8b949e`.
- Search icon (magnifying glass) on the left inside the input.
- As user types, the file tree filters in real-time with a subtle fade on non-matching items.

### File Tree
- Standard **recursive tree view** of the project's files and folders.
- **Folder items**:
  - Chevron arrow (▶ / ▼, 12px, `#8b949e`) that rotates 90° on expand (200ms rotation animation).
  - Folder icon (closed 📁 / open 📂 variants, or custom SVG icons in `#e3b341` amber).  
  - Folder name in 13px `#c9d1d9`.
  - Indent each nesting level by 16px.
  - Expand/collapse with smooth **max-height transition** (300ms ease-out) — children slide in/out.
- **File items**:
  - File icon based on type (16px):
    - `.ts`/`.tsx` → TypeScript blue icon
    - `.js`/`.jsx` → JavaScript yellow icon
    - `.py` → Python green icon
    - `.css`/`.scss` → Pink/magenta icon
    - `.json` → Yellow icon
    - `.md` → Gray document icon
    - `.png`/`.jpg`/`.svg` → Image icon
    - Default → Generic file icon
  - File name in 13px `#c9d1d9`, truncated with ellipsis.
  - Hover: background `rgba(255,255,255,0.04)`, subtle left border accent (2px teal).  
- **Interactions**:
  - **Single click** on a file: highlights it and shows a **mini preview** in a tooltip/popover (first ~20 lines of code) OR adds a `@filename` reference to the chat input (configurable behavior).
  - **Double click** on a file: opens it in a larger preview panel or marks it as active context.
  - **Right-click** on any item → **context menu**:
    - "Add to chat context" (adds `@filepath` mention)
    - "Open in editor" (opens preview)
    - "Rename" (inline rename input)
    - "Delete" (with confirmation)
    - "Copy path" (copies full path to clipboard)
    - Separator line
    - "New file" (creates in current folder)
    - "New folder" (creates in current folder)
  - The context menu is a floating card with `#21262d` background, `#30363d` borders, 14px items, hover highlight `rgba(255,255,255,0.06)`, rounded corners 8px, subtle shadow.

### Collapsed State (icon-only mode)
- When sidebar collapses to 0px it is fully hidden (not icon-strip). The toggle button remains accessible in the top bar.
- This is simpler and gives maximum space to the chat.

---

## 6. Center — Chat Area (Primary Focus)

**Background**: `#0d1117`  
**Flex**: `flex-grow: 1`, fills all available space between sidebars.

### 6.1 Welcome / Empty State

When the session is brand new (no messages yet), display a centered welcome composition:

- **Agent avatar**: A clean geometric icon or abstract mark (40px, teal accent `#58a6ff`) — not a photo. Think a stylized terminal prompt or circuit node.
- **Welcome heading**: "Start a conversation about your project" in 20px `#e6edf3`, font-weight 600.
- **Subtext**: "I can help you read files, write code, run commands, and more." in 14px `#8b949e`.
- **Suggestion chips** (optional, 2-4 items in a row): Quick-start prompts as rounded pills:
  - "Explain this project's structure"  
  - "Find and fix bugs"  
  - "Add a new feature"  
  - "Refactor the codebase"  
  - Each chip: `#21262d` background, 1px border `#30363d`, 13px `#8b949e` text, hover → border `#58a6ff`, text `#c9d1d9`. Clicking inserts the text into the chat input.
- The entire welcome composition has a **subtle floating animation** (gentle 6px vertical oscillation, 4s cycle, ease-in-out) to feel alive.
- As soon as the user sends their first message, the welcome state **fades out** (200ms opacity → 0, then removed from DOM).

### 6.2 Message List

- Vertical scrollable container. Newest messages at the bottom.  
- **Auto-scroll behavior**: When new content arrives (streaming or new messages), the list auto-scrolls to the bottom. **If the user manually scrolls up** (more than 100px from bottom), auto-scroll **pauses** and a **"Jump to bottom"** button appears (see §6.6). Auto-scroll resumes when the user scrolls back to within 50px of the bottom.
- Messages have generous vertical padding: 16px above and below each message group.
- Max content width: ~720px, centered within the chat area. On very wide screens, messages don't stretch edge-to-edge — they maintain readable line lengths.

### 6.3 User Messages

- **Alignment**: Left-aligned (not right-aligned — this is a coding tool, not iMessage. Consistent left alignment reduces visual noise and makes scanning easier when there are code blocks).  
- **Avatar**: Small circle (28px) with user's initial or a user icon, `#21262d` background, 14px `#c9d1d9` letter.
- **Message bubble**: Subtle `#21262d` background, rounded corners 12px (slightly less rounding on the left where the avatar sits — like 4px top-left, 4px bottom-left, 12px top-right, 12px bottom-right).  
- **Text**: 14px `#e6edf3`, line-height 1.6.  
- **Timestamp**: Tiny (11px) `#484f58`, positioned above or below the message, showing relative time ("2m ago") or absolute time on hover.
- User messages may contain:
  - Plain text
  - `@mentions` of files (rendered as inline pills/badges with file icon, teal accent, monospace)
  - Attached images (rendered inline, max 400px wide, rounded 8px, clickable for full view)

### 6.4 Agent Messages

- **Alignment**: Left-aligned.  
- **Avatar**: Small circle (28px) with the agent icon (matching the welcome state icon), `#0d1117` background with a subtle teal ring/border.  
- **No bubble background**: Agent messages render as clean text directly on the `#0d1117` background — this differentiates them visually from user messages and makes long responses feel less heavy.
- **Content rendering**:
  - **Markdown**: Full markdown support — headers (h1-h4, `#e6edf3`, font-weight 600/500), bold, italic, inline code (monospace, `#ff7b72` on `#161b22` pill background, rounded 4px, 1px padding), lists (unordered with `#58a6ff` bullet, ordered with `#8b949e` numbers), blockquotes (left border 3px `#58a6ff`, `#8b949e` text, `rgba(88,166,255,0.05)` bg), horizontal rules, links (`#58a6ff`, underline on hover).
  - **Code blocks**: 
    - Background: `#161b22`, border: 1px solid `#30363d`, rounded 8px.
    - Top bar: language label (12px `#8b949e`, top-left, e.g., "TypeScript") + **copy button** (top-right, clipboard icon, 14px, `#8b949e` hover → `#c9d1d9`, tooltip "Copy code"). Copy button shows a brief checkmark ✓ on success (200ms).
    - Code text: 13px monospace (JetBrains Mono or system mono), line-height 1.6, syntax highlighted:
      - Keywords: `#ff7b72` (coral/red)
      - Strings: `#a5d6ff` (light blue)
      - Functions: `#d2a8ff` (purple)
      - Variables: `#ffa657` (orange)
      - Comments: `#8b949e` (gray, italic)
      - Numbers: `#79c0ff` (blue)
    - Line numbers: optional, 12px `#484f58`, right-aligned, separated by a subtle vertical line.
  - **Diff / File Edit Previews** (when agent proposes or shows code changes):
    - Container: `#161b22` bg, 1px `#30363d` border, rounded 8px.
    - Header: file path (12px monospace `#8b949e`) + change summary (e.g., "+12 -3" in green/red).
    - Added lines: green left border (3px `#3fb950`), `rgba(63,185,80,0.1)` background, text `#e6edf3`.
    - Deleted lines: red left border (3px `#f85149`), `rgba(248,81,73,0.1)` background, text `#e6edf3` with strikethrough.
    - Unchanged context lines: `#484f58` text, no background.
    - Line numbers in `#484f58`.
  - **Thinking / Reasoning Section** (when the model exposes its chain-of-thought):
    - Collapsible block with a header: "Reasoning" + chevron icon (▼ collapsed / ▲ expanded), 12px `#8b949e`.
    - On expand: reveals the agent's internal reasoning in slightly smaller text (13px), `#8b949e` color, with a left accent border (2px `#30363d`), `rgba(255,255,255,0.02)` background.
    - Default state: **collapsed** (to reduce clutter). Toggle is smooth 300ms height animation.
  - **Tool Output Blocks**: When agent shows results from a tool execution:
    - Compact block with tool icon + tool name header (e.g., "🔍 Read file: src/app.tsx").
    - Output in a scrollable code-like container (max-height 300px, overflow-y auto), monospace 13px.
    - Status badge: ✓ success (green) or ✗ error (red).

### 6.5 Tool Approval Cards

These are **inline cards** that appear within the message flow when the agent requests permission to execute a tool (file edit, shell command, etc.). They are the most critical interactive element — the user MUST notice and act on them.

**Visual design**:
- **Container**: `#161b22` background, 1px border `#30363d`, rounded 10px, `box-shadow: 0 2px 12px rgba(0,0,0,0.3)`.
- **Entrance animation**: Slides in from the bottom with a spring animation (500ms, `cubic-bezier(0.34, 1.56, 0.64, 1)` — slight overshoot for attention). Fades in from 0 → 1 opacity simultaneously.
- **Header**: 
  - Left: Tool icon (e.g., ✏️ for file edit, ⚡ for shell command, 📂 for directory operation) + Tool name in 13px `#e6edf3` font-weight 600.
  - Right: A subtle pulsing indicator (teal ring, 2s cycle) to draw attention.
- **Body**: 
  - **Parameters displayed clearly**:
    - For file edits: file path (monospace 12px `#8b949e`), operation type ("Edit file", "Create file", "Delete file").
    - For shell commands: the full command in a code block (monospace 13px, `#161b22` bg, `#ff7b72` text for the command itself).
  - **Preview of changes**: For file edits, show a diff preview (same styling as §6.4 diffs) so the user can see exactly what will change before approving.
- **Footer**: 
  - **Approve button** (left): Filled `#238636` (green) background, white text, 14px, rounded 8px, 120px wide. Hover → `#2ea043`. Press → slight scale(0.97). Icon: ✓ checkmark.
  - **Reject button** (right): Outlined, 1px `#f85149` border, `#f85149` text, 14px, rounded 8px, 120px wide. Hover → filled `#f85149` bg with white text. Press → slight scale(0.97). Icon: ✗ cross.
  - **"Always approve for this session" checkbox**: Small checkbox (14px) + label in 12px `#8b949e`, positioned below or beside the buttons. When checked, future tool approvals of the same type are auto-approved with a subtle notification.
- **Timeout behavior**: If the user doesn't respond within a configurable timeout (e.g., 60s), the card **shakes** (a quick horizontal oscillation, 300ms) and the border briefly flashes `#f85149`. A "Timed out" badge appears. The agent then asks for confirmation again.
- **After action**: Once approved or rejected, the card transitions: 
  - Approved → border turns `#238636`, buttons fade out, a "✓ Approved" badge slides in, card collapses to a compact one-line summary after 2s.
  - Rejected → border turns `#f85149`, buttons fade out, a "✗ Rejected" badge slides in, card collapses similarly.

### 6.6 Scroll-to-Bottom Button

- A **floating circular button** (40px diameter), positioned at the bottom-center of the chat area, above the input bar.
- Background: `#21262d` with 1px `#30363d` border, subtle shadow.
- Icon: Down chevron (⌄), 18px, `#c9d1d9`.
- **Visibility**: Only visible when the user has scrolled up more than 100px from the bottom. Fades in/out with a 200ms opacity transition + slight translateY(8px → 0px).
- **Unread indicator**: When new messages arrive while scrolled up, a small teal dot (8px) appears on the button's top-right corner, pulsing gently.
- On click: smooth scroll to bottom (300ms ease-out), then button fades out.

### 6.7 Streaming Text Effect

- Agent responses appear **character by character** (or word by word for speed) with a **blinking cursor** at the insertion point.
- Cursor: 2px wide, `#58a6ff` teal, blinking at 1s cycle (500ms visible, 500ms hidden).
- The streaming speed should feel natural — not too fast (unreadable) and not too slow (frustrating). ~30-50ms per character is a good target.
- As text streams in, the container grows smoothly (no jumps). Code blocks and markdown render progressively — a code block's opening fences appear first, then the code streams in, then the closing fences appear.
- When streaming completes, the blinking cursor **fades out** (200ms).

### 6.8 Error States in Chat

- **Inline errors**: Red-tinted message block with `#f85149` left border, `rgba(248,81,73,0.06)` background. Error message in 13px `#f85149`. Includes a **"Retry"** button (outlined, same red).  
- **Network error**: A banner at the top of the chat area (not blocking messages) with "Connection lost. Retrying…" in `#f85149` with a spinning indicator. Disappears when connection restores.
- **Rate limit**: Warning banner in `#d29922` (amber) with "Rate limit reached. Waiting before retry…" and a countdown.

---

## 7. Right Panel — Context & Info

**Width**: 200px  
**Background**: `#161b22`  
**Border left**: 1px solid `rgba(255,255,255,0.06)`  
**Collapsible**: Yes, toggled via a button in the top bar.

When collapsed, its space is absorbed by the chat area (smooth 300ms width transition). On desktop (1024-1440px), this panel becomes an **overlay/drawer** from the right rather than pushing the chat. On tablet and mobile, it's a popover or part of the settings drawer.

### Sections (top to bottom):

**1. Context Window Usage**
- **Label**: "Context" in 11px `#8b949e`, uppercase, letter-spacing 0.5px.
- **Visual bar**: Horizontal progress bar, 8px height, rounded 4px, `#21262d` track.
  - Fill color transitions based on usage:
    - 0-50%: `#3fb950` (green)
    - 50-75%: `#d29922` (amber)  
    - 75-90%: `#f0883e` (orange)
    - 90-100%: `#f85149` (red) with subtle pulse animation
  - Smooth color transition as usage changes.
- **Text**: "42,300 / 200,000 tokens" in 12px `#8b949e`.
- **Tooltip on hover**: Breakdown by category (conversation history, file context, system prompt, etc.)

**2. Session Info**
- **Label**: "Session" in 11px `#8b949e`, uppercase.
- Items (13px `#c9d1d9`, each on its own line):
  - Started: relative time ("25 min ago")
  - Messages: count ("14 messages")
  - Model: current model name
 - Subtle dividers between items (1px `rgba(255,255,255,0.04)`).

**3. Quick Actions**
- **Compact mode toggle**: A small switch/toggle. When enabled, reduces message spacing and hides avatars for a denser view.
- **Diff view toggle**: Switch. When enabled, file edit previews show as full diffs. When off, shows only the changed sections.
- **Auto-scroll toggle**: Switch to enable/disable auto-scroll behavior.
- Each toggle: 12px label `#8b949e`, toggle on the right.

---

## 8. Bottom Bar — Chat Input Area

**Background**: `#161b22`  
**Border top**: 1px solid `rgba(255,255,255,0.06)`  
**Padding**: 12px 16px  
**Position**: Fixed at bottom, full width (minus sidebars).

### Text Input
- **Container**: `#0d1117` background, 1px border `rgba(255,255,255,0.1)`, rounded 12px.  
- **On focus**: border transitions to `#58a6ff` (teal/blue) with a subtle `box-shadow: 0 0 0 3px rgba(88,166,255,0.15)` — a soft glow. Transition: 200ms ease-out.
- **Textarea**: 
  - Auto-expanding: min 1 line (~24px), max ~6 lines (~144px). Smooth height animation (150ms).
  - 14px `#e6edf3` text, placeholder "Ask the agent anything about your project…" in `#484f58`.
  - No resize handle (auto-expand handles it).
  - Monospace font for code detection? No — keep it proportional (Inter) for readability. Code is rendered in messages, not in the input.

### Left Action Buttons (inside the input area, left side, vertically centered):

- **"@" Mention button**: `@` icon or text button, 14px, `#8b949e` hover → `#58a6ff`.
  - Clicking opens a **floating file/folder picker** (populated from the file tree) that appears above the input.
  - Typing `@` in the input also triggers this picker inline (autocomplete style).
  - Selected file appears as an inline pill/badge in the input: file icon + filename, `#21262d` bg, teal border, removable with × button.

- **Attachment button**: Paperclip icon, 14px, `#8b949e` hover → `#58a6ff`.
  - Opens file picker dialog (images, documents).
  - Attached files show as small pills below the input or inline.

- **Slash command button**: `/` icon or text, 14px, `#8b949e` hover → `#58a6ff`.
  - Typing `/` in the input triggers a **command palette** (floating list above input) with available commands:
    - `/help` — Show help
    - `/clear` — Clear conversation
    - `/compact` — Compact context
    - `/model` — Switch model
    - `/files` — Manage context files
    - `/undo` — Undo last action
  - Each command: icon + name + short description. Keyboard navigable (↑↓ arrows, Enter to select).

### Right Side:

- **Send button**: 
  - Circular or rounded-square, 36px × 36px.
  - **Disabled state**: `#21262d` background, `#484f58` icon, no hover effect, `cursor: not-allowed`.
  - **Enabled state** (when input has text): `#58a6ff` (teal/blue) background, white arrow-up icon (→ ↑ send icon), 18px. Hover → `#79c0ff`, slight scale(1.05). Press → scale(0.95). Transition: 150ms.
  - On click: message sends, input clears, button returns to disabled state. Subtle send animation (button pulses briefly).

- **Stop button** (appears when agent is generating): Replaces the send button. Red circular button with a square stop icon (⏹). Clicking stops the agent's response generation.

### Below the Input (subtle footer strip):
- **Left**: Current model badge — tiny pill (e.g., "Claude 3.5 Sonnet" in 11px `#8b949e`, `#21262d` bg, 1px `#30363d` border, rounded 4px). Clicking opens the model switcher.
- **Right**: Token count estimate — "~24 tokens" in 11px `#484f58`. Updates in real-time as the user types. Fades in/out.

---

## 9. Color System (Dark Theme — Default)

| Element | Color | Notes |
|---------|-------|-------|
| Chat background | `#0d1117` | Deepest layer |
| Sidebar / panels / top bar / input bar | `#161b22` | Elevated surfaces |
| Cards, inputs, code blocks | `#21262d` | Interactive surfaces |
| Borders (subtle) | `rgba(255,255,255,0.06)` or `#30363d` | Low-contrast dividers |
| Borders (focused) | `#58a6ff` | Active/focused elements |
| Primary text | `#e6edf3` | Headings, important content |
| Secondary text | `#c9d1d9` | Body text, file names |
| Muted text | `#8b949e` | Labels, timestamps, descriptions |
| Faint text | `#484f58` | Placeholders, very secondary info |
| Accent (primary) | `#58a6ff` | Links, active states, focus rings |
| Accent hover | `#79c0ff` | Hover state of accent |
| Success | `#3fb950` | Approve, success states |
| Warning | `#d29922` | Rate limits, cautions |
| Error | `#f85149` | Reject, errors, destructive |
| User message bubble | `#21262d` | Subtle, not prominent |
| Code keyword | `#ff7b72` | Syntax highlighting |
| Code string | `#a5d6ff` | Syntax highlighting |
| Code function | `#d2a8ff` | Syntax highlighting |
| Code variable | `#ffa657` | Syntax highlighting |
| Code comment | `#8b949e` | Syntax highlighting |
| Code number | `#79c0ff` | Syntax highlighting |
| Diff addition bg | `rgba(63,185,80,0.1)` | Green tint |
| Diff deletion bg | `rgba(248,81,73,0.1)` | Red tint |

---

## 10. Typography

| Use | Font | Size | Weight | Line Height |
|-----|------|-------|--------|-------------|
| Body / messages | Inter, system-ui | 14px | 400 | 1.6 |
| Headings (in messages) | Inter | 18-24px | 600 | 1.3 |
| UI labels | Inter | 11-12px | 500 | 1.4 |
| Code blocks | JetBrains Mono, SF Mono, Fira Code | 13px | 400 | 1.6 |
| File paths | JetBrains Mono | 12px | 400 | 1.4 |
| Button text | Inter | 13-14px | 500 | 1.0 |
| Top bar text | Inter | 14px | 600 | 1.0 |

---

## 11. Animations & Micro-Interactions (Complete Inventory)

| Element | Trigger | Animation | Duration | Easing |
|---------|---------|-----------|----------|--------|
| Message streaming | Agent responding | Typewriter effect with blinking cursor | Continuous | — |
| New user message | Send | Fade in + slide up 8px | 200ms | ease-out |
| New agent message | First token | Fade in | 200ms | ease-out |
| Tool approval card | Agent requests action | Slide up from bottom + fade in | 500ms | spring (0.34, 1.56, 0.64, 1) |
| Approval card timeout | Timer expires | Horizontal shake | 300ms | ease-in-out |
| Approval card resolved | User approves/rejects | Border color transition + badge slide in + collapse | 600ms | ease-out |
| File tree expand | Click folder | max-height + chevron rotation | 300ms | ease-out |
| File tree collapse | Click folder | max-height + chevron rotation | 200ms | ease-in |
| Sidebar toggle | Click toggle | Width 0 ↔ 250px | 300ms | ease-out |
| Right panel toggle | Click toggle | Width 0 ↔ 200px | 300ms | ease-out |
| Scroll-to-bottom button | Scroll position | Opacity + translateY fade | 200ms | ease-out |
| Unread indicator | New msg while scrolled up | Teal dot pulse | 2s cycle | ease-in-out |
| Input focus glow | Click/focus input | Border color + box-shadow | 200ms | ease-out |
| Send button state | Input has/loses text | Color + scale transition | 150ms | ease-out |
| Model dropdown | Click trigger | Fade + scale from 95% | 200ms | spring |
| Agent status dot | State change | Color + pulse change | 300ms | ease-out |
| Welcome state float | Always (empty state) | Vertical oscillation 6px | 4s cycle | ease-in-out |
| Welcome state dismiss | First message sent | Opacity → 0 | 200ms | ease-out |
| Context bar fill | Token usage changes | Width + color transition | 500ms | ease-out |
| Error shake | Error occurs | Horizontal oscillation | 400ms | ease-in-out |
| Skeleton loading | Content loading | Shimmer sweep left→right | 1.5s cycle | linear |
| Code block copy | Click copy | Icon → checkmark → back | 600ms total | — |

---

## 12. Responsive Behavior

### Desktop Wide (>1440px)
- Full three-panel layout: 250px sidebar + flexible chat (min ~740px) + 200px right panel.
- All panels visible by default.
- Message max-width: ~720px centered in chat area.

### Desktop (1024-1440px)
- Two-panel layout: 250px sidebar + flexible chat.
- Right panel becomes a **slide-in overlay** from the right (triggered by button, has semi-transparent backdrop, 300px wide overlay).
- Message max-width: ~640px.

### Tablet (640-1024px)
- Left sidebar hidden by default — opens as a **drawer** from the left (300px wide, semi-transparent backdrop, slides in 300ms).
- Right panel accessible via **popover** from top bar button (not a full drawer — a positioned dropdown card).
- Chat area takes full remaining width.
- Message max-width: 100% with 24px horizontal padding.
- Tool approval buttons may **stack vertically** (Approve above, Reject below) if horizontal space is tight.

### Mobile (<640px)
- No sidebars visible by default.
- Left sidebar: **full-height drawer** with backdrop, slides from left, 85vw width.
- Right panel: accessible from a **bottom sheet** or settings modal.
- Chat area: full width, 12px horizontal padding.
- Top bar: simplified — project name truncated, some buttons move into a "…" overflow menu.
- Input area: full width.
  - Action buttons (@, attachment, /) move **below** the input instead of inside it.
  - Send button stays right of input.
  - Slash command palette is a full-screen bottom sheet instead of floating.
- Tool approval cards: buttons stack vertically (full width each).
- Code blocks: horizontal scroll instead of wrapping, with a subtle fade on the right edge hinting at more content.
- Welcome suggestion chips: 2 per row instead of 4.

---

## 13. Keyboard Shortcuts & Accessibility

### Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `Enter` | Send message (when input focused) |
| `Shift + Enter` | New line in input |
| `Escape` | Cancel current action (close dropdowns, dismiss approval, etc.) |
| `Cmd/Ctrl + /` | Focus chat input |
| `Cmd/Ctrl + B` | Toggle sidebar |
| `Cmd/Ctrl + Shift + B` | Toggle right panel |
| `Cmd/Ctrl + N` | New session |
| `Cmd/Ctrl + K` | Command palette (slash commands) |
| `↑` (in empty input) | Edit last user message |
| `Tab` | Accept autocomplete suggestion (file mention, slash command) |

### Accessibility
- All interactive elements have proper **focus indicators** (2px `#58a6ff` outline, 2px offset, rounded to match element).  
- **ARIA roles**:
  - Chat message list: `role="log"`, `aria-live="polite"` (announces new messages to screen readers).
  - Individual messages: `role="article"`.
  - Tool approval cards: `role="alertdialog"` with `aria-label="Tool approval required"`, focus is trapped within until resolved.
  - Sidebar file tree: `role="tree"`, items `role="treeitem"`.
  - Model dropdown: `role="listbox"`, items `role="option"`.
  - Send button: `aria-label` changes between "Send message" and "Stop generating".
- **Focus management**: When a tool approval card appears, focus moves to the Approve button. After resolving, focus returns to the chat input.
- **Screen reader announcements**: New agent messages are announced. Tool approval requests are announced as high-priority alerts. Streaming text is announced in chunks (not character by character).
- **Reduced motion**: Respect `prefers-reduced-motion`. Disable all non-essential animations (floating, shimmer, spring bounces). Keep functional transitions (fade for appearance, color changes) but make them instant or very short (50ms).

---

## 14. States to Design

Please show the following states/variations:

1. **Active conversation** — multiple messages, agent is streaming a response with a code block, tool approval card visible below.
2. **Empty / welcome state** — new session, no messages, welcome screen with suggestion chips.
3. **Tool approval pending** — agent has requested to run a shell command, showing the command and waiting for approval.
4. **File edit diff** — agent is showing a proposed file edit with colored diff.
5. **Sidebar open with file tree** — showing an expanded project structure.
6. **Mobile layout** — how the screen adapts to narrow width.

---

## 15. Design Deliverables

- A single high-fidelity mockup of the **active conversation** state (desktop, 1440×900) as the primary deliverable.
- Supplementary smaller mockups or annotated variants showing the empty state, mobile layout, and tool approval card in detail.
- A color palette swatch showing all colors from §9.
- Spacing and sizing annotations on at least one mockup.
- If possible, a brief animation storyboard or notes describing the key motion behaviors (streaming, approval card entrance, sidebar toggle).

---

*This prompt is self-contained. Use it to generate a complete, production-quality UI design for the CLINE_AGENT Project / Chat Session screen.*