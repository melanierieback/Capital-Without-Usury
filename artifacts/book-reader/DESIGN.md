---
name: NEC Book Reader Design System
description: Visual identity conventions for the NEC book readers (this repo serves Capital Without Usury; the system originated with the Capital That Serves Life reader): dark NEC branding, color palette, key components, and layout.
---

## Core palette (hardcoded in homepage/reading header — not CSS vars)
- Hero bg: `.nec-hero` radial-gradient ellipse `#2e1b6a → #1a1042 → #0d0c28 → #030410`
- TOC bg: `.nec-toc-bg` linear `#080a1c → #050611`
- Reader sidebar bg: `#060718` (hardcoded inline style on `<aside>`)
- Header: `.nec-header` — `rgba(5,6,17,0.92)` + backdrop-blur:12px
- Reading header: `.nec-reading-header` — `rgba(6,7,18,0.96)` + gold-tinted border `rgba(201,160,58,0.12)`
- Gold accent: `rgba(201,160,58,…)` — labels, borders, badge numbers, ornamental dividers
- Primary CTA: `linear-gradient(135deg, #c9a03a 0%, #a87828 100%)` dark text `#0a0810` — GOLD, not purple
- Secondary CTA: outlined, `rgba(255,255,255,0.16)` border, `rgba(240,232,210,0.70)` text

## Hero layout (HomePage.tsx)
- Always dark (hardcoded colors — dark mode toggle only affects the reading surface)
- Two columns: **cover art LEFT** (`w-[400px]` at lg), **book info RIGHT** (flex-1)
- Mobile: stacks vertically (cover first, info second)
- Hero body uses `items-start` + `pt-14 md:pt-20` — NOT `items-center` (avoids centering in full viewport)
- `min-h-screen` keeps it full-page but content is top-anchored

## Header nav (home page)
- Center: "Contents" (underline active state), "Search" (uses `<Search>` component), "About" (placeholder), "NEC Home ↗" (external link)
- Right: dark mode toggle only

## TOC section rows (homepage)
- Prologue badge: ★ gold star in rounded square
- Chapter 1-17: number in gold rounded square
- Conclusion badge: "END" label
- "PROLOGUE"/"CHAPTER N" small gold uppercase label
- Chapter title (serif, hover → white)
- "N sections" right-aligned (hidden on mobile)
- ChevronRight expand toggle

## Key components
- `NecLogo.tsx` — SVG starburst mark V-shape (apex ~(15,11), arms → (2,34) and (31,34)) + "Non‑Extractive / Capital" text. Props: `size?: 'sm'|'md'|'lg'`.
- `CoverArt.tsx` — dark SVG panel: title "CAPITAL THAT SERVES LIFE" + subtitle in gold serif at top, luminous starburst (apex at y=100), open book with gold pages (y=240-312), root system (y=312-400), cityscape silhouette (y=390-430), gold corner ornaments + border frame.
- `StarburstDecor` (inside HomePage.tsx) — SVG with 4 diagonal rays from (520,300) origin + CSS radial glow div via `.nec-starburst-outer`.
- `TOC.tsx` — "CONTENTS OUTLINE" label at top, gold progress bar, active section gold, "VIEW FULL CONTENTS" link at bottom.
- `ChapterView.tsx` — "CHAPTER N" label gold (`rgba(201,160,58,0.65)`), then title, then gold ◆ ornamental divider (thin lines + diamond center).
- `Reader.tsx` — dark sidebar (`#060718`) with "Back to Contents" text link, breadcrumb in reading header, `N% complete` display.

## Architecture
- Home page always dark (hardcoded colors)
- Reader sidebar always dark (`#060718`)
- Reader content area respects light/dark mode via CSS vars (`--background` = ivory in light)
- `localStorage.setItem("nec-last-chapter", slug)` — tracks last chapter for "Continue" button

**Why:** NEC brand is dark navy + deep blue-purple gradient + luminous starburst + white text + gold accents. The reader should feel like a premium publication inside the NEC ecosystem. The target mockup (`target-mockup-nec-book-reader.png_1780350453421.png`) is the primary design reference.
