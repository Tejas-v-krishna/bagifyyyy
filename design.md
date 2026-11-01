# BAGIFYYYY Studio — Design System

This document is the single source of truth for the `/studio` admin panel.
Every studio page must follow it. Tokens and bridge rules live in
[`src/app/studio/studio.css`](src/app/studio/studio.css) and are applied under
the `.studio-app` scope so the storefront is untouched.

---

## 1. Principles

1. **One language.** A card is always a card. A field is always a field. An
   action is always a pill. No page invents its own corner radius.
2. **Paper and ink.** Neutral surfaces (`#f5f5f2` canvas, white cards, near-black
   ink). Colour is reserved for status (`paid`, `sold out`, `archived`, errors).
3. **Quiet hierarchy.** Page title → section title → label → body. No decorative
   eyebrow copy, no duplicate helpers.
4. **Touch first.** Controls are at least 40px tall. Hover-only controls are not
   allowed; every action must be visible and tappable.
5. **Mobile is the default.** Nothing may overflow horizontally. Wide data can
   scroll inside its own container.

---

## 2. Tokens

### Colour

| Token | Value | Use |
| --- | --- | --- |
| `--studio-canvas` | `#f5f5f2` | Page background |
| `--studio-surface` | `#ffffff` | Cards, fields, modals |
| `--studio-panel` | `#f0f0ed` | Subtle panels, table headers |
| `--studio-panel-strong` | `#e9e9e5` | Hover / selected panel |
| `--studio-ink` | `#0b0b0b` | Primary text, primary buttons |
| `--studio-muted` | `#5f5f5f` | Labels, metadata, secondary text |
| `--studio-line` | `rgba(11,11,11,.16)` | Borders and dividers |
| `--studio-line-soft` | `rgba(11,11,11,.08)` | Inner dividers |
| `--studio-success` | `#047857` | Paid, delivered, in stock |
| `--studio-warning` | `#b45309` | Processing, archived |
| `--studio-danger` | `#b91c1c` | Failed, cancelled, delete |
| `--studio-info` | `#1d4ed8` | Shipped / informational |

Do not use `y2k-*` colour utilities in the studio. They render blue-grey and
fight the monochrome canvas. Use `text-black`, `text-black/50`, `bg-[#f5f5f2]`,
and the status colours above.

### Radius

| Token | Value | Applies to |
| --- | --- | --- |
| `--studio-radius-card` | `12px` | Cards, panels, modals, page sections |
| `--studio-radius-control` | `8px` | Inputs, selects, textareas, thumbnails |
| `--studio-radius-pill` | `9999px` | Every action: buttons, chips, badges, links styled as buttons |

**Rule of three:** 12px surfaces, 8px fields, pills for actions. Nothing else.
No `rounded-sm`, `rounded-md`, arbitrary `rounded-[...]`, or square panels.

### Spacing

Use the 4px scale: `4 / 8 / 12 / 16 / 24 / 32`.

- Page sections: `space-y-6` (24px).
- Card padding: `p-4` mobile, `sm:p-6` desktop.
- Card headers: `px-4 py-4` mobile, `sm:px-6`.
- Grid gaps: `gap-2` mobile, `sm:gap-4`.
- Page horizontal padding comes from the studio layout (`p-3 sm:p-6 lg:p-8`).

### Typography

One family: **ITC Avant Garde** (`font-sans`). `font-display` and
`font-microgramma` resolve to the same face; do not introduce another.

| Role | Size | Treatment |
| --- | --- | --- |
| Page title (`h1`) | 24px mobile / 30px desktop | 500, uppercase, `-0.03em` |
| Toolbar title (`.studio-toolbar-title`) | 18px / 20px | 500, uppercase; used only in the sticky Add/Edit Product bar |
| Section title (`h2` in admin pages) | 14px / 16px | 500, uppercase, letter-spacing 0 |
| Label | 9px | 700, uppercase, `0.12em`, muted |
| Body | 12px | 400, muted or ink |
| Stat value | 20px / 24px / 30px | 700, tabular where possible |

Decorative eyebrow text above titles is not part of the system. The product
storefront preview inside the edit page keeps its own storefront type scale and
is excluded from admin `h2` sizing.

### Elevation

Cards use one shadow: `--studio-shadow-card` (`0 1px 2px rgba(0,0,0,.04)`).
Everything else is flat. Modals may use a stronger shadow.

---

## 3. Components

### Page header

```tsx
<div className="studio-page-header">
  <h1 className="studio-title">Orders Management</h1>
  <button className="...">Refresh</button>
</div>
```

- One `h1` per page, always the current nav label.
- Header sits on a single `1px` bottom border.
- Actions sit on the right; on mobile they go below the title.
- No subtitle paragraph, no eyebrow.

### Card

```tsx
<div className="studio-card">
  <div className="... border-b border-black/10 px-4 py-4 sm:px-6">
    <h2 className="studio-section-title">Recent orders</h2>
  </div>
  <div className="p-4 sm:p-6">…</div>
</div>
```

- Use `.studio-card` in new markup. Existing `bg-white border` surfaces are
  bridged to the same 12px card by `studio.css`.
- Headers use `border-black/10` (never blue-grey).

### Buttons

| Variant | Class | Shape |
| --- | --- | --- |
| Primary | `btn-bagify` | Black pill |
| Secondary | white surface + `border border-black/10` | Pill |
| Icon | square icon button, `p-2` | Pill / circle |
| Danger | red text + `border-red-200` | Pill |

All interactive controls are pills. Do not build a secondary button with
`rounded-lg`; the global action rule makes it a pill intentionally.
Disabled controls use `disabled:opacity-50` and remain the same shape.

### Fields

- Input, select, textarea: 8px radius, `border-black/10`, white surface.
- Height: 40px minimum for inputs/selects; textareas 96px minimum.
- Focus: `focus:border-black`.
- Labels: 9px uppercase muted, `mb-1.5`.
- Placeholders: `placeholder:text-black/40`.
- Read-only field shells use `.studio-control` so they keep the 8px control
  radius instead of the 12px card radius.

### Filter chips and selector tabs

Use pills, never underline tabs:

```tsx
<button className={`border px-3 py-2 text-[10px] font-bold uppercase tracking-wider ${
  active ? "border-black bg-black text-white" : "border-black/10 bg-white text-black/60"
}`}>
  Processing (12)
</button>
```

Category selectors, status filters, ledger channels and order filters share this
pattern.

### Badges

- Status badges: pill, 9px uppercase, colour + matching border.
- Counts: black pill or outlined pill.
- Never square. `studio.css` bridges legacy bordered uppercase spans to pills.

### Tables

- Wrapped in a `.studio-card` / white bordered surface.
- Header: `bg-[#f5f5f2]`, 9px uppercase muted.
- Rows: `border-t border-black/10`, 12px text.
- Wide tables scroll horizontally inside the card; the page itself never
  scrolls sideways.

### Empty states

- Centered, `py-10`.
- One sentence, 12px muted, no jokes or multi-line helper copy.

### Modals

- Surface white, 12px radius, `border-black/15`.
- Title 16px uppercase, body 12px muted.
- Actions: secondary + primary, right aligned on desktop, full width on mobile.

---

## 4. Implementation rules

1. Every studio page is inside `.studio-app` (set by `src/app/studio/layout.tsx`).
2. New tokens/utilities go in `studio.css`, not inline hex values.
3. Prefer `text-black` / `text-black/50`; do not add `text-y2k-*`.
4. Prefer `bg-[#f5f5f2]` or `bg-white`; do not add `bg-y2k-ice`.
5. Borders are `border-black/10`, `border-black/15`, or semantic status borders.
6. No `rounded-sm`, `rounded-md`, `rounded-[...]`, or unrounded panels.
7. No decorative paragraphs or eyebrow labels above page titles.
8. Any hover-only control must also be visible at all times on touch devices.

## 5. Page checklist

- [ ] One `h1`, same size/treatment as every other page.
- [ ] Page header uses a single bottom border and no subtitle.
- [ ] All surfaces are 12px cards.
- [ ] All fields are 8px and at least 40px tall.
- [ ] All actions are pills and visible on mobile.
- [ ] Status is communicated with the semantic colours, not blue-grey.
- [ ] No horizontal page overflow at 390px.
- [ ] Empty/loading states use one muted sentence.
