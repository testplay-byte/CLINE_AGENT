# CLINE_AGENT — Onboarding / Welcome Screen UI Design Prompt

> **Copy everything below this line into your AI design tool.**

---

## Prompt: Design a Multi-Step Onboarding Wizard for "CLINE_AGENT"

Design a **desktop web application page** (primary viewport: **1440×900px**) for the first-time onboarding experience of **CLINE_AGENT** — an AI-powered coding agent application. This is a modern, professional tool for developers, so the design must feel polished, trustworthy, and minimal — not playful or flashy.

---

### Design Philosophy

- **Modern & clean**: Minimal, uncluttered, purposeful. Every element earns its place.
- **Professional tone**: This is a serious developer tool. Think linear.com, vercel.com, or raycast.com — not a consumer social app.
- **Highly animated**: Smooth transitions, fades, slide-ins, hover effects, and micro-interactions throughout. Motion should feel intentional and fluid (not distracting).
- **Adaptive**: The layout must gracefully respond to desktop (>1024px), tablet (640–1024px), and mobile (<640px) viewports.
- **Customizable-ready**: Use CSS variables / design tokens so themes (dark, light), text sizes, and accent colors can be swapped later.
- **Accessible**: Visible focus states, keyboard navigation, proper ARIA labels, sufficient contrast ratios.

---

### Overall Layout (Desktop — 1440×900)

The page fills the full viewport with no scroll (content fits within 900px height). It uses a **split-panel card/wizard** pattern:

```
┌──────────────────────────────────────────────────────────────┐
│  ┌───────────────────────────┐  ┌──────────────────────────┐ │
│  │                           │  │  ○ ● ○  Progress (2/3)  │ │
│  │    LEFT PANEL             │  │                          │ │
│  │    (Branding / Hero)      │  │    RIGHT PANEL           │ │
│  │                           │  │    (Multi-Step Form)     │ │
│  │    Animated background    │  │                          │ │
│  │    App name + tagline     │  │    [Active step content] │ │
│  │    Description           │  │                          │ │
│  │    AI + Code visual       │  │                          │ │
│  │                           │  │    [Buttons / Skip]      │ │
│  │                           │  │                          │ │
│  └───────────────────────────┘  └──────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

The entire wizard sits inside a **centered card** (approximately 1100px wide × 620px tall) with generous border-radius (16–20px) and a subtle border. The card is vertically centered on the page. Behind the card, the page background is a very dark neutral color (e.g., `#0a0a0b` or `#111113`).

The card itself has a **slightly lighter dark background** (e.g., `#16161a` or `#1a1a1f`) to create subtle depth.

---

### Left Panel — Branding / Hero Section (Desktop only, ~40% width)

The left panel is the visual anchor of the onboarding experience.

**Content (top to bottom, centered vertically and horizontally):**

1. **Logo / Icon**: A small, refined icon for CLINE_AGENT. It could be a stylized terminal prompt icon (`>_`) or an abstract geometric mark suggesting AI + code. Keep it monochrome or use the accent color. Size: ~48–56px.

2. **App Name**: "CLINE_AGENT" in a bold, modern sans-serif font (e.g., Inter, Geist, or similar). Large but not oversized — around 28–32px. Letter-spacing slightly tight. Color: white or near-white.

3. **Tagline**: "Your AI Coding Agent" — in a lighter weight, slightly smaller (16–18px), with reduced opacity (60–70%). This sits directly below the app name.

4. **Description**: 2–3 lines of body text (14–16px, regular weight, ~55% opacity) explaining what the app does. Example:
   > Configure your AI model and start building with an intelligent coding agent that understands your project, writes code, and manages files — all from a clean, modern interface.

5. **AI + Code Visual**: Below the text, a subtle visual element suggesting AI and coding. This could be:
   - A stylized line of code with a subtle AI sparkle/pulse animation
   - A minimalist illustration of a terminal window with AI-generated text
   - Abstract geometric shapes (subtle floating orbs or connecting nodes)
   
   This should be understated — decorative, not distracting. Use low opacity (20–30%) or the accent color at low saturation.

**Background**: A subtle animated gradient mesh or abstract floating shapes (very low opacity). Think soft, slowly drifting gradient blobs or a gentle noise texture that gives the panel depth without being distracting. Animation: slow drift/pulse, looping, 10–15 second cycle.

**The left panel should feel like a premium brand moment — elegant, quiet confidence.**

---

### Right Panel — Multi-Step Setup Form (~60% width)

The right panel contains the interactive wizard. It has its own slightly different background shade for subtle separation (e.g., slightly lighter than the left panel, or use a very faint left-border divider).

#### Progress Indicator

At the **top** of the right panel, a horizontal step indicator showing the current step:

```
   ① Welcome ──── ② Model Setup ──── ③ Ready
```

- Each step is a small circle (number inside) connected by a thin line.
- **Completed steps**: Circle filled with accent color, checkmark inside. Connecting line filled.
- **Current step**: Circle has accent color border (2px) and is slightly larger. Step label is bold and full opacity.
- **Upcoming steps**: Circle is outlined (1px, gray), label is dimmed (40% opacity).
- **Animation**: When advancing to the next step, the progress line fills with a smooth animation (300ms ease-out). The circle scales up slightly as it becomes active.

Step labels are small (12–13px), positioned below each circle.

#### Step 1 — Welcome

**Layout**: Centered vertically within the right panel.

- **Heading**: "Welcome to CLINE_AGENT" — bold, 22–26px, white/near-white.
- **Subtext**: 1–2 lines of friendly but professional text, e.g.:
  > Let's get you set up in under a minute. We'll configure your first AI model so you can start coding right away.
  
  Body text style: 14–16px, 50–60% opacity, regular weight.

- **"Get Started" button**: Primary action button, centered below the text.
  - Style: Accent color background (e.g., a calm blue like `#3b82f6` or a teal `#14b8a6`), white text, medium weight, 14–16px font.
  - Padding: 12px 32px, border-radius 10–12px.
  - Hover: Gentle scale (1.02–1.03), slight brightness increase, box-shadow glow in accent color.
  - Animation on load: Fade in + subtle slide up (300ms, ease-out, 100ms delay).

- **"Skip setup" link**: Below the button, small text (12–13px), gray, underlined on hover. "Skip for now — set up models later."

- **Entrance animation for Step 1**: The entire step content fades in and slides up slightly (400ms ease-out). The heading, subtext, and button should stagger in with ~80ms delays between each element.

#### Step 2 — Model Setup

**Layout**: Form fields stacked vertically, left-aligned within the right panel. Content should be centered vertically if space allows, or top-aligned with generous padding.

- **Heading**: "Configure Your AI Model" — bold, 20–22px.
- **Subtext**: "Enter your provider details below. You can add more models later." — 13–14px, 50% opacity.

- **Form Fields** (each field is a full-width row with a label above):

  1. **Provider** — Dropdown / Select
     - Label: "Provider"
     - Options: Anthropic, OpenAI, Google, Mistral, Ollama (Local), Custom
     - When a provider is selected, the Base URL field below auto-populates with the standard endpoint.
     - Style: Dark input field (slightly lighter than panel background, e.g., `#22222a`), rounded (8–10px border-radius), 1px border (gray, 20% opacity), subtle transition on focus.
     - Focus animation: Border transitions to accent color, a subtle glow (box-shadow) appears around the field (200ms ease-out).
     - Dropdown chevron icon on the right side.

  2. **Base URL** — Text input
     - Label: "Base URL"
     - Pre-filled based on provider (e.g., `https://api.anthropic.com` for Anthropic).
     - Editable — user can override.
     - Placeholder text when empty: "https://api.example.com/v1"
     - Same field styling as above.
     - Small info icon/tooltip next to the label: "Auto-filled based on provider. Modify if using a proxy."

  3. **API Key** — Password input with toggle
     - Label: "API Key"
     - Input type: password (masked by default).
     - Show/hide toggle: A small eye icon button on the right side of the input. Clicking toggles between `••••••••` and plain text. Icon changes between eye-open and eye-closed.
     - Placeholder: "sk-ant-..." or "Enter your API key"
     - Same field styling. The toggle button has its own hover state.

  4. **Model ID** — Text input with autocomplete
     - Label: "Model ID"
     - When the user starts typing, show a dropdown with **autocomplete suggestions** based on the selected provider:
       - Anthropic: `claude-sonnet-4-20250514`, `claude-opus-4-20250514`, `claude-3-5-haiku-20241022`
       - OpenAI: `gpt-4o`, `gpt-4.1`, `o3`, `o4-mini`
       - Google: `gemini-2.5-pro`, `gemini-2.5-flash`
       - etc.
     - Autocomplete dropdown appears below the field with a subtle fade-in (150ms).
     - Each suggestion item has hover state (background highlight).
     - Keyboard navigable (arrow keys + enter).

  5. **Display Name** — Text input
     - Label: "Display Name"
     - Placeholder: "e.g., Claude Sonnet (Main)"
     - This is what the user will see when switching models later.
     - Optional but encouraged — if left empty, auto-generate from provider + model ID.

- **Button Row** (below all fields, right-aligned or full-width):

  - **"Back" button**: Secondary style — outlined or ghost button (transparent background, 1px border, text-only). Left side.
  - **"Save & Continue" button**: Primary button style (same as "Get Started" in Step 1). Right side or centered.
    - On click: Validate required fields (provider, API key, model ID). If validation fails, show inline error messages (red text, subtle shake animation on the invalid field).
    - If valid: Smooth transition to Step 3.

  - **"Skip" link**: Small text below the button row: "Skip — I'll set this up later."

- **Spacing between fields**: 16–20px vertical gap. Consistent and comfortable.

- **Entrance animation**: Fields slide in from the right with a stagger (each field appears 60ms after the previous one). The heading appears first, then fields cascade in.

#### Step 3 — Ready / Success

**Layout**: Centered content, celebratory but professional.

- **Success icon**: A large checkmark inside a circle (accent color). 
  - Animation: The circle draws itself (stroke-dashoffset animation), then the checkmark draws inside it. Total: ~600ms. After completion, a subtle pulse glow radiates outward once.
  - Size: ~64px.
  - Alternatively: a subtle confetti burst (small particles, accent-colored, 500ms duration) emanating from the checkmark.

- **Heading**: "You're All Set!" — bold, 22–26px, white.
- **Subtext**: 1–2 lines:
  > Your model is configured and ready to use. Let's start building something great.
  
  Style: 14–16px, 50% opacity.

- **"Go to Dashboard" button**: Primary button, same style. The main call-to-action.
  - On click: The entire onboarding card fades out (opacity 0, slight scale down to 0.98, 400ms) and the page transitions to the Dashboard.

- **Optional**: A subtle background animation — very faint particles or a gentle pulse behind the success icon.

- **Entrance animation**: The checkmark animates first (600ms), then the heading and subtext fade in (300ms delay), then the button fades in (500ms delay).

---

### Skip Flow

If the user clicks "Skip" at any point:
- A small confirmation tooltip or inline message appears: "You can configure your AI model anytime from Settings."
- The wizard transitions directly to Step 3 (success) with a modified message:
  - Heading: "Welcome to CLINE_AGENT"
  - Subtext: "You can set up your AI model anytime from Settings. Let's explore the dashboard."
- The success icon is still shown but without the confetti (simpler celebration).

---

### Responsive Behavior

#### Desktop (>1024px)
- Full split-panel layout as described above.
- Left panel: ~40% width. Right panel: ~60% width.
- Card: ~1100px wide, centered.

#### Tablet (640–1024px)
- Card becomes full-width (with 24–32px horizontal margin).
- Left panel collapses to a **compact branding bar** at the top of the card (~100–120px tall).
  - Logo + app name + tagline in a single horizontal row.
  - Animated background still present but more subtle.
- Right panel fills the remaining space below.
- Progress indicator may switch to a compact horizontal bar with just circles (labels hidden or shown as tooltips).
- Form fields remain full-width but slightly smaller font/padding.

#### Mobile (<640px)
- Card is full-screen (no margin, no border-radius).
- Left panel becomes a **slim header** (~60–80px tall):
  - Logo (small, 24px) + app name only. Tagline hidden.
  - No animated background (performance).
- Right panel fills the rest of the screen.
- Progress indicator: minimal — just a thin accent-colored progress bar at the very top of the right panel (no circles or labels).
- Form fields: full-width, touch-friendly tap targets (minimum 44px height).
- Buttons: full-width, stacked vertically (Back above, Save below).
- Font sizes scale down slightly (heading: 20px, body: 14px).
- Step transitions: slide left/right (horizontal) since vertical space is tight.

---

### Theme — Default Dark Mode

The default appearance is a **professional dark theme**:

- **Page background**: Very dark, near-black (`#09090b` or `#0a0a0f`)
- **Card background**: Dark gray (`#16161a` or `#1a1a20`)
- **Input field background**: Slightly lighter (`#1e1e26` or `#22222c`)
- **Borders**: Subtle, low-opacity white or gray (`rgba(255,255,255,0.08)` or `rgba(255,255,255,0.12)`)
- **Primary text**: White or near-white (`#f0f0f5` or `#e4e4e7`)
- **Secondary text**: Reduced opacity white (`rgba(255,255,255,0.5)` or `rgba(255,255,255,0.6)`)
- **Accent color**: A calm, professional accent — suggest **blue** (`#3b82f6` or `#6366f1`) or **teal/cyan** (`#06b6d4` or `#14b8a6`). Use it sparingly — primary buttons, active step indicator, focus rings, success states. Not everywhere.
- **Error color**: Soft red (`#ef4444`)
- **Success color**: Green (`#22c55e`)
- **Warning color**: Amber (`#f59e0b`)

**The design should be theme-agnostic**: use CSS variables / design tokens for all colors so a light theme can be applied later without structural changes. Do NOT bake dark-theme assumptions into component structure.

---

### Animations — Detailed Specification

| Animation | Trigger | Duration | Easing | Details |
|-----------|---------|----------|--------|---------|
| Card entrance | Page load | 600ms | ease-out | Card scales from 0.96 to 1.0 and fades in from opacity 0. 100ms delay. |
| Step content enter | Step change | 400ms | ease-out | Content slides in from the direction of navigation (left if going back, right if going forward) with fade. |
| Step content exit | Step change | 250ms | ease-in | Content slides out in the opposite direction with fade. Overlaps with entrance by 100ms. |
| Progress indicator fill | Step change | 300ms | ease-out | The connecting line fills from left to right. Active circle scales up 1.15x then settles to 1.0. |
| Button hover | Hover | 200ms | ease-out | Scale to 1.03, slight brightness increase (+5–8%), subtle box-shadow glow. |
| Button press/click | Click | 100ms | ease-in | Scale to 0.98. |
| Input focus | Focus | 200ms | ease-out | Border color transitions to accent. Subtle box-shadow glow (accent color, 4–8px blur, 20% opacity). |
| Input error shake | Validation fail | 400ms | ease-in-out | Horizontal shake (±4px, 3 oscillations). Border turns error color. |
| Success checkmark draw | Step 3 enter | 600ms | linear | SVG stroke-dashoffset animation: circle draws first (400ms), then checkmark (200ms). |
| Success pulse | After checkmark | 800ms | ease-out | Single radial pulse glow emanating from the checkmark. |
| Confetti (optional) | Step 3 enter | 600ms | ease-out | Small accent-colored particles burst outward from the checkmark and fade. 15–20 particles. |
| Background animation | Continuous | 10–15s loop | ease-in-out | Slow-moving gradient blobs or floating shapes. Very subtle — barely noticeable. |
| Stagger fade-in | Page load / step enter | per element | ease-out | Individual elements within a step fade in with 60–100ms delay between each. |
| Skip confirmation | Skip click | 200ms | ease-out | Small message fades in below the skip link, with a subtle slide down (4px). |
| Skip transition | After skip | 400ms | ease-out | Direct jump to Step 3 with modified messaging. Same transition animation as normal step change. |

**Animation philosophy**: Motion should guide attention, provide feedback, and create a sense of polish — never slow the user down or cause distraction. All animations should respect `prefers-reduced-motion` (disable or minimize for users who prefer reduced motion).

---

### Accessibility Requirements

1. **Focus states**: Every interactive element (buttons, inputs, dropdowns, links) must have a clearly visible focus ring — a 2px solid outline in the accent color, with 2–3px offset. The focus ring must be visible against both the field background and the page background.
2. **Keyboard navigation**: All form fields, buttons, and the skip link must be reachable via Tab key. The dropdown must be operable with arrow keys and Enter. Autocomplete suggestions must be keyboard-navigable.
3. **Labels**: Every input field must have a visible `<label>` element (not just placeholder text). Labels must be programmatically associated with their inputs.
4. **ARIA**: 
   - Progress indicator: `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-label` describing the current step.
   - Password toggle button: `aria-label` that changes between "Show API key" and "Hide API key".
   - Error messages: `role="alert"`, associated with the relevant input via `aria-describedby`.
   - The wizard container: `role="region"` with `aria-label="Setup wizard"`.
5. **Contrast**: All text must meet WCAG AA contrast ratios (4.5:1 for body text, 3:1 for large text) against its background.
6. **Screen reader**: The step change should announce the new step to screen readers (e.g., via `aria-live="polite"` region announcing "Step 2 of 3: Configure Your AI Model").

---

### Additional Notes

- **No login/authentication**: There is no username/password login flow. The onboarding is purely a setup wizard. A simple password field may appear on the frontend side (auto-filled or read-only), but it is NOT a login — it is just a local access token shown for reference.
- **"Go to Dashboard" transition**: When Step 3's button is clicked, the entire onboarding card should exit gracefully (fade out + slight scale down, ~400ms) before the next page/view appears. Do not abruptly switch.
- **Language**: All UI text is in English. The design should accommodate longer strings (e.g., for future i18n).
- **Icons**: Use simple, consistent line icons (1.5–2px stroke). Consider icons from a standard set like Lucide, Phosphor, or Heroicons. Keep icon usage minimal — only where they aid comprehension (eye toggle, chevron, info tooltip, checkmark).
- **Scrollbar**: If content overflows on smaller screens, use a custom-styled thin scrollbar (4–6px wide, rounded, accent-colored thumb, transparent track).

---

### Summary of Deliverables

Design this as a **single page** with three interactive states (Step 1, Step 2, Step 3). The design should clearly communicate:

1. The visual composition of each state (desktop layout shown as primary, with notes for tablet/mobile).
2. The transition between states (showing the animation direction and timing).
3. The dark color palette with specific hex values or design token names.
4. Typography specifications (font family, sizes, weights).
5. Spacing and sizing of all elements.
6. Interactive states (default, hover, focus, active, error, disabled).

---

**End of prompt.**
