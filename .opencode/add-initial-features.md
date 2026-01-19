# Final Feature Plan (final/)

## Scope

Add categories, search (Lunr), RSS, and featured images to the final design. No Notion ingestion. No social icons beyond footer.

## 1) Categories taxonomy

- Extend content schema to include `categories: string[]`.
- Add `/categories/` index page with title-only header (blinking cursor).
- Add `/categories/[category]/` page:
  - Title-only header showing category name.
  - Posts rendered using the same `PostCard` layout as the homepage.
- Post page: show a single category label (first category) next to “Back to posts”, separated by ` - `.

## 2) Search (Lunr, Ctrl/Cmd+K overlay)

- Build-time generation of `search.json` (title, description, tags, category label, slug, date).
- Navbar search trigger on the right.
- JS-only: search UI hidden unless JS enabled (add `js-enabled` class to `<html>`).
- Ctrl+K / Cmd+K opens overlay, centers the search box, blurs background.
- Close methods: X button, Esc key, click outside the modal.
- Results show title, excerpt, and up to 3 tags.

## 3) RSS (`/rss.xml`)

- Add Astro RSS endpoint at `/rss.xml`.
- Include title, link, date, description, tags, and categories.
- Keep existing `<link rel="alternate">` pointing to `/rss.xml`.

## 4) Featured image on post pages

- Render post `image` above post content.
- Capped height using `clamp(220px, 35vh, 360px)` with `object-fit: cover`.

## Validation

- Run `npm run check` and `npm run build`.
- Verify homepage, tags index, tags detail, categories index, categories detail, post page, and search overlay behavior.
