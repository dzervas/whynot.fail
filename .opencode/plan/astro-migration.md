# Hugo → Astro Migration Plan: 3 Design PoCs

## Overview

Migrating whynot.fail from Hugo to Astro.js with three distinct dark theme proof-of-concept designs for evaluation.

## Current State Analysis

- **Framework:** Hugo with "Tracks" theme
- **Content Source:** Notion via `notion-markdown` script (build-time)
- **Styling:** Brown theme (`#38312f`), Raleway font
- **Features:** Tags, categories, build badges, webring, search, Utterances comments
- **Issues:** Brown color, font too small, titles too large

## Target Requirements

- [x] Dark theme (no brown)
- [x] Horizontal post cards on homepage
- [x] Clickable tags with discovery pages
- [x] CI build badge per post (passing/failing/unknown)
- [x] No runtime JS (build-time Astro only)
- [x] Fully responsive (mobile-first)
- [x] Code block syntax highlighting
- [x] Callouts (note/info/warning/danger)
- [x] Lucide icons
- [x] Personal touches (dashed lines, ASCII art, etc.)
- [x] Clear, modular code structure

---

## The 3 Design PoCs

### PoC 1: Terminal Noir

| Attribute | Value |
|-----------|-------|
| **Accent Color** | Cyan `#22d3ee` |
| **Vibe** | Clean dark with subtle terminal influences |
| **Background** | Near-black with very subtle ASCII circuit pattern |
| **Personal Touches** | Dashed vertical separators, `/* comment */` styled headers |
| **Build Badge** | Terminal-style `[PASS]` `[FAIL]` `[???]` |

### PoC 2: Pixel Punk

| Attribute | Value |
|-----------|-------|
| **Accent Color** | Amber `#f59e0b` |
| **Vibe** | Retro tech with tasteful pixel art (no animation) |
| **Background** | Solid dark with subtle noise texture |
| **Personal Touches** | Pixel art corner decorations, scanline overlay on header only, ASCII logo in footer |
| **Build Badge** | Pixel-art styled icons |

### PoC 3: Midnight Editorial

| Attribute | Value |
|-----------|-------|
| **Accent Color** | Purple `#a855f7` |
| **Vibe** | Modern editorial with personality |
| **Background** | Deep blue-black gradient |
| **Personal Touches** | Horizontal dashed rules, elegant separators, refined typography |
| **Build Badge** | Pill-shaped elegant badges |

---

## Project Structure (Each PoC)

```
design-N-name/
├── astro.config.mjs
├── package.json
├── tsconfig.json
├── public/
│   ├── fonts/
│   │   ├── Raleway-*.woff2
│   │   └── JetBrainsMono-*.woff2
│   └── img/
│       └── logo.png
├── src/
│   ├── components/
│   │   ├── Header.astro          # Navigation bar
│   │   ├── Footer.astro          # Footer with social links
│   │   ├── PostCard.astro        # Horizontal card for homepage
│   │   ├── TagList.astro         # Tag pills with links
│   │   ├── BuildBadge.astro      # CI status badge
│   │   ├── Callout.astro         # Note/Info/Warning/Danger
│   │   └── Icon.astro            # Lucide icon wrapper
│   ├── layouts/
│   │   ├── BaseLayout.astro      # HTML shell, head, fonts
│   │   └── PostLayout.astro      # Single post template
│   ├── pages/
│   │   ├── index.astro           # Homepage with post list
│   │   ├── about.astro           # About page
│   │   ├── tags/
│   │   │   ├── index.astro       # All tags listing
│   │   │   └── [tag].astro       # Posts filtered by tag
│   │   └── posts/
│   │       └── [...slug].astro   # Dynamic post pages
│   ├── content/
│   │   ├── config.ts             # Content collection schema
│   │   └── posts/
│   │       ├── sample-post-1.md
│   │       ├── sample-post-2.md
│   │       ├── sample-post-3.md
│   │       └── sample-post-4.md
│   └── styles/
│       ├── global.css            # Base styles, typography
│       ├── theme.css             # Design-specific colors/effects
│       └── code.css              # Syntax highlighting overrides
```

---

## Content Collection Schema

```typescript
// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const posts = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.date(),
    tags: z.array(z.string()).default([]),
    build_status: z.enum(['passing', 'failing', 'unknown']).optional(),
    image: z.string().optional(),
    writer: z.string().default('dzervas'),
    description: z.string().optional(),
  }),
});

export const collections = { posts };
```

---

## Sample Posts to Generate

### Post 1: "Getting Started with Nix Flakes"
- Tags: `nix`, `linux`, `devops`
- Build Status: `passing`
- Content: Code blocks (Nix, Bash), callout examples

### Post 2: "Reverse Engineering a USB Protocol"
- Tags: `reversing`, `hardware`, `python`
- Build Status: `failing`
- Content: Hex dumps, Python code, warning callouts

### Post 3: "My 3D Printer Made Me Cry (Again)"
- Tags: `3d-printing`, `hardware`, `failure`
- Build Status: `unknown`
- Content: Images, humor, info callouts

### Post 4: "Building a Mechanical Keyboard from Scratch"
- Tags: `hardware`, `electronics`, `diy`
- Build Status: `passing`
- Content: Multiple code languages, tables

---

## Typography Specifications

| Element | Font | Size | Weight |
|---------|------|------|--------|
| Body | Raleway | 18px (1.125rem) | 400 |
| Headings | Raleway | scaled down from current | 600-700 |
| Code | JetBrains Mono | 15px (0.9375rem) | 400 |
| Line Height | - | 1.65 | - |

---

## Callout Syntax

Using GitHub-style blockquote callouts:

```markdown
> [!NOTE]
> This is a note callout

> [!INFO]
> This is an info callout

> [!WARNING]
> This is a warning callout

> [!DANGER]
> This is a danger callout
```

Implemented via remark plugin or Astro component.

---

## Responsive Breakpoints

| Breakpoint | Width | Layout Changes |
|------------|-------|----------------|
| Mobile | < 640px | Single column, stacked nav |
| Tablet | 640-1024px | Two-column grid options |
| Desktop | > 1024px | Full layout, max-width container |

---

## Build & Dev Commands

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

---

## Implementation Order

1. **Phase 1: Scaffold** (all 3 projects)
   - Initialize Astro projects
   - Set up folder structure
   - Configure TypeScript & Astro config

2. **Phase 2: Core Components**
   - BaseLayout with fonts, meta
   - Header & Footer
   - Icon component (Lucide)

3. **Phase 3: Content System**
   - Content collection config
   - Sample posts with frontmatter
   - PostLayout with full styling

4. **Phase 4: Design-Specific Styling**
   - Theme colors & variables
   - Personal touches per design
   - Build badge variants

5. **Phase 5: Pages**
   - Homepage with PostCard grid
   - Tag pages (index + dynamic)
   - About page

6. **Phase 6: Polish**
   - Code highlighting theme
   - Callout component
   - Responsive testing
   - Cross-page consistency

---

## Post-Selection Phase

After you choose a design, the following will be added:

- [ ] Notion API integration (or keep current script)
- [ ] RSS feed generation
- [ ] Search functionality (if desired)
- [ ] Full navigation with webring
- [ ] SEO meta tags & OpenGraph
- [ ] Favicon & social images
- [ ] GitHub Actions deployment

---

## Files Preserved from Current Site

- `static/img/logo.png` → `public/img/logo.png`
- `static/img/favicon.ico` → `public/favicon.ico`
- `static/CNAME` → `public/CNAME`
- `content/about/index.md` → content migrated to `src/pages/about.astro`

---

## Validation Plan

Using browser automation to verify:

1. Homepage renders with all post cards
2. Post pages display correctly with:
   - Build badge
   - Tags (clickable)
   - Code highlighting
   - Callouts
3. Tag pages filter correctly
4. Mobile responsiveness
5. No JavaScript errors (should be none)
6. Consistent styling across pages

---

## Notes

- Comments (Utterances) skipped for PoC phase
- Webring navigation skipped for PoC phase
- Posts use lorem ipsum placeholder content
- Each PoC is fully independent and runnable
