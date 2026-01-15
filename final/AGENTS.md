# AGENTS.md (final)

## Scope

These instructions apply to all files under `final/`.

## Project Goals

- Maintain the Terminal Noir look: dark palette, cyan accents, dashed separators, subtle ASCII circuit background.
- Keep the tone playful/technical and avoid a “template” feel.
- No runtime JS unless explicitly approved; Astro build-time is fine.
- Maintain fully responsive layout (mobile-first, desktop polish).

## Key UI Decisions

- Header uses ASCII logo + tagline only (no graphic logo).
- Homepage header is `// recent_posts` only (no extra title).
- Footer has centered social links only (no copyright, no tagline).
- Blog post pages should be as wide as the homepage content.

## Components & Structure

- `src/components/Icon.astro` uses Lucide icons; Mastodon is custom SVG.
- Callouts use GitHub-style blockquotes (`[!NOTE]`, `[!INFO]`, `[!WARNING]`, `[!DANGER]`) via `remark-callouts.mjs`.
- Tags must remain clickable and route to tag pages.
- Build badges are required on post cards and post headers.

## Styling Notes

- Typography: Raleway for body, JetBrains Mono for code/labels.
- Avoid brown tones. Keep high contrast and readable line height.
- Post card images: no hover/zoom effects; keep left/right layout.
- Read-post link should stay centered in card footer alignment.

## Coding Style

- Prefer small, focused components and avoid duplication.
- Use descriptive names; avoid single-letter variables except trivial loops.
- Keep styles close to the component when they are component-specific.
- Use CSS variables for colors and spacing; avoid hard-coded magic values when possible.
- Add brief comments only for non-obvious logic (e.g., build badge logic, callout parsing).
- Keep TypeScript strict and avoid `any`.

## Assets

- Favicon: `public/favicon.svg` (stylized “W”). Keep it in sync with header branding.
- Header ASCII logo is embedded in `src/components/Header.astro`.

## Validation

- Use `npm run build` to confirm static output.
- Verify homepage, tags index, tag detail, and a post page.
