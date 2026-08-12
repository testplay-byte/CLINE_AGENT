# UI Design Prompt — CLINE_AGENT Dashboard / Homepage Screen

> **Copy-paste this entire prompt into your AI image/design generation tool.**
> **Screen dimensions: 1440×900 (desktop). The design must also adapt to tablet (640–1024px) and mobile (<640px).**

---

## PROMPT

Design a web application dashboard/homepage screen for **CLINE_AGENT** — a professional AI coding agent application. This is the main landing page users see after completing onboarding. The design must be modern, beautiful, minimalistic yet rich, highly animated, responsive, and professional. This is a serious developer tool, not a toy.

### Overall Layout

- **Viewport**: 1440×900 desktop page, fully scrollable.
- **Structure**: A sticky top navigation bar spanning the full width, followed by a single-column main content area centered on the page with comfortable horizontal padding (~80px on each side at desktop, scaling down for smaller viewports). **No sidebar on this screen.**
- **Dark theme** with these background colors: deepest background `#0a0a0f`, card/surface background `#12121a`, elevated surface `#1a1a2e`. Subtle accent color: a calm, desaturated blue or teal (e.g., `#4a9ead` or `#5b8def`). All text in light shades: primary text `#e8e8ef`, secondary/muted text `#8888a0`.
- **Typography**: System font stack or Inter. Modular type scale. Generous line height (1.5–1.7) for readability.
- **Spacing**: 4px grid system. Consistent, breathable spacing between sections and elements.
- **Corners**: Rounded corners on all cards and containers (12px for cards, 8px for buttons/inputs, 16px for larger containers).

---

### 1. Top Navigation Bar

A slim, sticky navigation bar fixed to the top of the viewport with a `backdrop-filter: blur(12px)` glass effect and a very subtle bottom border (`1px solid rgba(255,255,255,0.06)`). Height: ~56px. Contains:

- **Left side**: The app name/logo — "CLINE_AGENT" in a clean, understated type treatment. Small monospaced or geometric icon mark (optional). Not loud or dominant — just enough to brand the space. Logo text color: `#c8c8d8`.
- **Center or right area**: **Active Model Indicator** — a compact, clickable pill/badge showing the current AI model name and its provider (e.g., "Claude 3.5 Sonnet · Anthropic" or "GPT-4o · OpenAI"). The pill has a subtle background (`#1a1a2e`), a tiny green dot (status indicator, meaning "connected/ready"), and the model name in `#e8e8ef`. Clicking this pill opens a **model selector dropdown** (described below). The pill should feel interactive — slight hover brightness increase.
- **Right side**: Three icon buttons in a row, each 36×36px, rounded, with `#1a1a2e` background and subtle hover state (`#252540`):
  1. **Settings gear icon** (⚙) — navigates to Settings screen.
  2. **Notification bell icon** (🔔) — shows a small red dot badge if there are unread notifications.
  3. **User avatar** — a 32×32px circle with the user's initials (e.g., "JD") on a subtle gradient background (using the accent color). Clicking opens a user menu dropdown.

**Model Selector Dropdown** (shown when model pill is clicked):
- Appears below the pill, smoothly animating open (height + opacity, 200ms ease-out).
- Lists 3–4 model options, each showing: model name, provider, and a small radio/check indicator for the active one.
- Compact, ~240px wide, with the same `#12121a` background and a subtle border.
- Last option: "Manage Models..." in muted text, linking to the Model Management screen.

---

### 2. Hero / Welcome Section

Positioned directly below the nav bar with generous top padding (~48px). This is the first thing the user sees. Keep it clean and purposeful — no clutter.

- **Greeting**: A large, warm heading: "Good morning, [Name]" (time-adaptive: Good morning / Good afternoon / Good evening). Font size ~28–32px, weight 600, color `#e8e8ef`. Below it, a single line of muted secondary text: "Here's what's happening with your projects." in `#8888a0`, ~15px.
- **Quick Action Buttons** — placed to the right of the greeting (or below it on mobile/tablet):
  1. **"New Project"** — Primary action button. Accent color background (calm blue/teal), white text, 14px weight 500, padding 10px 20px, rounded 8px. Slight hover brightness increase + subtle scale (1.02). On press: scale down to 0.98. This is the most prominent interactive element on the page.
  2. **"Open Recent"** — Secondary button. Transparent/ghost style: `#1a1a2e` background, `#c8c8d8` text, same padding and rounding. Hover: background lightens slightly. A subtle right-arrow icon (→) sits inside the button after the text.

On desktop, the greeting text is left-aligned and the buttons are right-aligned, both on the same row. On tablet/mobile, they stack vertically (greeting on top, buttons below, left-aligned).

---

### 3. Quick Stats Bar

A slim horizontal row of 4 minimal stat cards, positioned below the Hero section with ~32px top margin. Each stat card is compact (~equal width in a 4-column flex row):

| Stat | Icon | Value | Label |
|------|------|-------|-------|
| Total Projects | folder icon | "12" | "Projects" |
| Total Sessions | chat bubble icon | "47" | "Sessions" |
| Current Model | cube/chip icon | "Claude 3.5" | "Active Model" |
| Days Active | calendar icon | "23" | "Days" |

- Each card: `#12121a` background, 12px rounded corners, ~80px height.
- The value is large and bold (20px, weight 600, `#e8e8ef`). The label is small and muted (12px, `#8888a0`).
- A tiny icon sits to the left of or above the value in the accent color at reduced opacity.
- Cards have a very subtle border (`1px solid rgba(255,255,255,0.04)`). No hover effects needed — these are read-only.
- On mobile: 2×2 grid instead of 4-column row.

---

### 4. Recent Projects Section

Below the stats bar with ~40px top margin. This is the main content section.

**Section header**: "Recent Projects" in 18px weight 600, `#e8e8ef`. Aligned left. To its right (or on mobile, below): a subtle "View All Projects →" text link in the accent color.

**Project Cards Grid**:
- Desktop (>1024px): 3-column grid, ~16px gap.
- Tablet (640–1024px): 2-column grid.
- Mobile (<640px): 1-column, full width.
- Show max 6 cards. If more exist, the "View All Projects" link is visible.

**Each Project Card** (`#12121a` background, 12px rounded corners, subtle border `rgba(255,255,255,0.04)`, padding 20px):
- **Project name**: Bold, 16px, weight 600, `#e8e8ef` (e.g., "my-saas-app"). Single line, truncated with ellipsis if too long.
- **Project path**: Muted, 13px, `#8888a0`, monospaced font (e.g., "~/projects/my-saas-app"). Single line, truncated.
- **Meta row** (below path, small gap): Two pieces of info separated by a dot:
  - Last opened: "2 hours ago" or "Yesterday" (relative time, 12px, `#8888a0`).
  - Session count: "14 sessions" (12px, `#8888a0`).
- **Quick action icons** — a small row of icon buttons in the bottom-right corner of the card (or on hover only): Open (→ arrow), Settings (⚙ gear), Delete (trash). Each is 28×28px, rounded, transparent background, `#666680` icon color. Hover: icon turns `#e8e8ef`, background becomes `#1a1a2e`. The delete icon turns red on hover.
- **Hover effect**: The entire card lifts slightly (`translateY(-2px)`) and gains a deeper, softer box shadow (`0 8px 24px rgba(0,0,0,0.3)`). Transition: 200ms ease-out.

**Empty State** (when no projects exist):
- A centered container with a subtle illustration or large icon (e.g., a folder-plus outline icon) in `#444460`.
- Text: "No projects yet." in 18px `#c8c8d8`, followed by "Create your first project to get started." in 14px `#8888a0`.
- Below the text: the same "New Project" primary button (accent color) as in the hero section.
- The CTA button has a subtle pulsing/shimmer animation to draw attention.

---

### 5. Recent Activity Section

Below the Recent Projects section with ~48px top margin.

**Section header**: "Recent Activity" in 18px weight 600, `#e8e8ef`, aligned left.

**Activity List**: A vertical timeline/list of recent actions across all projects. Each entry is a horizontal row:

- **Left**: A 32×32px circle icon container with a subtle `#1a1a2e` background. Inside: a small icon representing the action type — chat bubble (for conversations), file icon (for file edits), code icon (for code changes), terminal icon (for command runs). Icon color: accent color at ~70% opacity.
- **Middle**: Two lines of text:
  - Line 1 (primary): Action description in 14px `#e8e8ef` (e.g., "Started a new session in my-saas-app" or "Edited 5 files in api-server").
  - Line 2 (secondary): Project name in 13px accent color, slightly muted.
- **Right**: Relative timestamp (e.g., "15 min ago", "2 hours ago") in 12px `#666680`, right-aligned.
- **Left accent border**: Each activity entry has a 2px left border in the accent color at 30% opacity, creating a subtle timeline feel.

- Show **5 entries by default**. Below the list: a "Show More" text button in the accent color (underlined on hover). Clicking expands to show all entries with a smooth height animation.
- Entries have a subtle hover background (`rgba(255,255,255,0.02)`).

---

### 6. Animations & Motion

The page should feel alive and responsive to interaction:

- **Page load**: Cards and sections enter with a staggered fade-in-up animation. The hero fades in first (0ms delay), then the stats bar (100ms), then project cards one by one from left-to-right, top-to-bottom (each card delayed 60ms after the previous). Activity entries stagger in similarly. Duration: 400ms each, ease-out.
- **Card hover**: `translateY(-2px)` + box-shadow deepening. Transition: 200ms ease-out.
- **Button press**: Scale down to 0.97. Transition: 100ms ease-in. On release, spring back to 1.0.
- **Button hover**: Subtle background brightness increase. Transition: 150ms.
- **Model dropdown**: Smooth expand (max-height + opacity, 200ms ease-out). Collapse is 150ms ease-in.
- **Scroll reveal**: As the user scrolls down, the Recent Activity section fades in from below (opacity 0→1, translateY 20px→0) when it enters the viewport. Duration: 500ms ease-out.
- **Empty state CTA**: A subtle shimmer/pulse animation on the "New Project" button — a soft radial glow that fades in and out every 2.5 seconds.
- **Activity list expand**: "Show More" smoothly increases the container height with a 300ms ease-out transition. New entries fade in with a 100ms stagger.

---

### 7. Responsive Behavior

**Desktop (>1024px)**:
- Full layout as described. 3-column project grid. Hero: greeting left, buttons right on same row. Stats: 4-column row. Comfortable horizontal padding (~80px).

**Tablet (640–1024px)**:
- 2-column project grid. Horizontal padding reduces to ~40px.
- Hero section stacks vertically: greeting above, buttons below (left-aligned).
- Stats bar becomes 2×2 grid.
- Nav bar: user avatar may hide behind a hamburger menu, or remain visible if space allows.

**Mobile (<640px)**:
- 1-column project grid, full-width cards. Horizontal padding ~20px.
- Hero: fully stacked, greeting and buttons vertically centered.
- Stats: 2×2 grid with smaller values.
- Nav bar: collapses to a **bottom navigation bar** (fixed to bottom) with 4 icon tabs: Home (dashboard), Projects, Models, Settings. The top nav is simplified to just the logo and model indicator pill.
- Activity entries: icon and text stack more compactly, timestamp moves below the description.
- Buttons: full-width on mobile for primary actions.

---

### 8. Accessibility

- All interactive elements must have visible **focus states**: a 2px outline ring in the accent color, offset by 2px from the element.
- **Keyboard navigation**: Full tab order through all interactive elements. The model dropdown and menus are keyboard-navigable (arrow keys + enter/escape).
- **ARIA labels**: Every icon button has an `aria-label` (e.g., "Settings", "Notifications", "Open project my-saas-app"). The model pill has `aria-label="Current model: Claude 3.5 Sonnet by Anthropic. Click to switch model."` The activity timeline has `role="list"` with each entry as `role="listitem"`.
- **Color contrast**: All text meets WCAG AA contrast ratios against their backgrounds. The accent color on `#0a0a0f` must have at least 4.5:1 contrast.
- **Screen reader**: The greeting, stats, project count, and activity entries are all readable by screen readers. The empty state is announced as a live region.
- **Reduced motion**: Respect `prefers-reduced-motion` — disable all non-essential animations, keeping only instant state changes.

---

### 9. Additional Notes

- The overall feel should be calm, focused, and professional — like a premium developer tool (think Linear, Vercel, or Raycast dashboard). Not flashy, not playful.
- Whitespace is used generously. The page should breathe.
- The accent color is used sparingly — only on primary actions, active indicators, links, and the activity timeline border. It should not dominate.
- All iconography should be from a consistent icon set (outline style, 1.5px stroke, 20px default size). Lucide or Phosphor icons style.
- The design should be neutral enough that a light theme can be created later by inverting the color system without rethinking the layout.
- No decorative illustrations or stock photos. Clean, icon-driven, type-driven.
