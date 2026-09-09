# MsgDock web design context

## Product surface

MsgDock is a local communication sandbox for developers. The web app is a focused inspection console for captured email and SMS traffic, not a generic SaaS dashboard.

The first shell intentionally renders without message fixtures. Message content must arrive through @msgdock/api-client.

## Visual direction

- Theme: dark developer environment with terminal-like precision.
- Composition: fixed utility header, persistent desktop navigation, open center workspace, narrow inspector rail.
- Density: compact and readable; use hairline borders and deliberate whitespace instead of stacked cards.
- Signature: monospace system labels with a single restrained lime status accent.
- Avoid: cloud/product marketing language, decorative gradients, fake metrics, bright purple SaaS styling, and invented message data.

## Tokens

The source of truth is src/index.css.

- background: near-black blue graphite canvas.
- card and sidebar: slightly raised graphite surfaces.
- border: cool, low-contrast rules.
- foreground / muted-foreground: high-contrast heading and subdued utility text.
- status-success: lime for active local/runtime states.
- status-warning / status-failed: reserved for real delivery states.

Use semantic Tailwind tokens such as bg-background, border-border, text-muted-foreground, and text-status-success. Do not introduce raw color utilities in product components.

## Typography

- Geist Variable is the primary UI family.
- Geist Mono is used for labels, navigation metadata, environment markers, and transport/status text.
- Headings stay compact and sentence case.
- Utility labels use uppercase mono with restrained tracking.

## Layout

- Header height: 2.75rem.
- Desktop sidebar width: shadcn Sidebar default width, visually offset below the header.
- Main workspace: one flexible message pane plus a 19rem inspector rail at large widths.
- Below large breakpoints: message pane and inspector stack vertically; sidebar becomes the shadcn mobile sheet.
- Every scrollable region owns its overflow and preserves stable geometry.

## Interaction contract

- Sidebar navigation uses real buttons, aria-current="page", visible focus, hover, and selected border treatment.
- SidebarTrigger is available from the header on desktop and mobile.
- Empty states explain what will appear and why they are empty.
- Message selection and inspector values will be introduced only when the API-client-backed data flow is connected.
- Respect reduced motion.

## Component ownership

- App.tsx: composition and active workspace section state.
- app-header.tsx: global identity, environment marker, sidebar trigger.
- app-sidebar.tsx: navigation and local transport context.
- main-workspace.tsx: pane layout and section context.
- message-pane.tsx: message stream surface and empty/loading states.
- details-pane.tsx: message inspector surface and detail states.
- components/ui/*: CLI-managed shadcn primitives; update them through shadcn CLI conventions.
