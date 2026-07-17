# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository purpose

This is the source for `richardy-lobo-sapan.github.io` — a personal portfolio site served directly by GitHub Pages from the `main` branch. There is no framework, build step, package manager, or test suite. The site is two static HTML pages sharing a common stylesheet and script.

## Working with this repo

- There is nothing to install, build, lint, or test. Changes are live on push (via GitHub Pages) — treat commits to `main` as publishing directly to the live site.
- To preview locally, open `index.html` in a browser or serve the directory with any static file server (e.g. VS Code Live Server). There is no dev server or hot reload configured.
- Sanity-check HTML/CSS/JS changes before committing since there's no test suite: a quick balanced-tag / brace / `node -c script.js` check catches most breakage (no linter is configured).
- Files:
  - `index.html` — homepage: intro, experience, interests, tech stack, outside-work, awards & research, featured-in, and a **Selected Projects** section (curated, ~6 cards).
  - `projects.html` — the full project archive (everything not in Selected Projects), reusing the same sidebar/nav shell as the homepage.
  - `style.css` — all styles for both pages.
  - `script.js` — all behavior for both pages (starfield background, scroll-reveal, back-to-top). Loaded with `defer` on both pages.
  - `IMG_20240918_212158_783.jpg` — profile photo referenced by `.avatar`.

## Structure of the pages

Both pages share one layout shell (sidebar + `<main>`), built from these pieces:

- **CSS custom properties** (`:root` in `style.css`) drive the dark, deep-space color theme (`--bg`, `--surface`, `--accent`, `--star`, etc.) — change colors here rather than hardcoding hex values in rules.
- **`#starfield`**: a fixed, full-viewport `<canvas>` painted by `script.js` — a sparse, twinkling starfield sitting behind all content (`z-index: 0`). It's paused when the tab is hidden and rendered as a static (non-animated) field under `prefers-reduced-motion`.
- **`.mobile-hero-wrap`**: a CSS-only nebula gradient band shown only below 640px (no image asset) — decorative context above the sidebar on mobile.
- **`.sidebar`**: avatar, name, title, social links (GitHub, LinkedIn, Google Scholar, ResearchGate, Medium — inline SVG icons), and in-page nav (`.sidenav` on desktop, `.mobile-nav` pill nav on small screens, toggled via the `@media (max-width: 640px)` block). On `projects.html`, sidenav links point back to `index.html#section` since those sections don't exist on that page.
- **`<main>`**: a sequence of `<section id="...">` blocks, each with the `.reveal` class for scroll-triggered fade-in (via `IntersectionObserver` in `script.js`). Section headings (`h2`) are auto-numbered with a CSS counter (`§ 01`, `§ 02`, ...) scoped per-page via `counter-reset: section` on `main` — don't hardcode numbers in markup.
- **`.exp-list`**: Experience timeline, styled as a vertical orbit line with dot markers (`::before` pseudo-elements) — no extra markup needed to add an entry beyond the existing `<li><span class="exp-year">…</span><div class="exp-text">…</div></li>` pattern.
- **`.entries` / `.entry-cite`**: Awards & Research, styled as hanging-indent academic citations (year + badge + title flow inline at the start of the citation text via `text-indent`). Badge classes: `.b-award`, `.b-research`, `.b-press`.
- **`.project-card`**: repeated block for each project — `h3`, `.project-pills` (tech tags, year as the last pill), a description paragraph, and `.project-links` (GitHub / live demo links).
- **`.view-all-card`**: the dashed-border appendix card at the end of `index.html`'s Selected Projects section, linking to `projects.html`.
- **Back-to-top button**: `#back-to-top`, shown/hidden by `script.js` based on scroll position — logic lives entirely in `script.js`, not inline `onclick`.

## Conventions when editing

- **Adding a new project**: decide whether it belongs in Selected Projects (`index.html`, curated — keep this to ~6 of the strongest/most recent) or the full archive (`projects.html`). Match the existing `.project-card` markup exactly: `h3`, `.project-pills` (year last), one descriptive `<p>`, and `.project-links` if there are external links. Keep the two pages' project counts truthful — `projects.html`'s intro paragraph and the homepage's `.view-all-card` blurb both state how many "more" projects there are; update both if the count changes.
- Section order in `<main>` should stay in sync with both `.sidenav` and `.mobile-nav` link lists on **both pages** — if you add/reorder a homepage section, update all four nav lists (desktop + mobile, on both `index.html` and `projects.html`) and their anchors.
- Because `style.css` and `script.js` are shared, a change to either affects both pages — check both after editing.
- The footer's "Last updated" text and copyright year are manually maintained on both pages — keep them in sync when making meaningful content changes.
- No external JS/CSS frameworks are used; keep additions dependency-free, consistent with the rest of the site. Respect the existing accessibility touches (`prefers-reduced-motion` handling in both `style.css` and `script.js`, `:focus-visible` styles, the print stylesheet) rather than reintroducing motion/animation that ignores them.
