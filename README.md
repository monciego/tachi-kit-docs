# Tachi Kit Docs

Documentation site for [Tachi Kit](https://github.com/monciego/tachi-kit), built with [Astro](https://astro.build) and [Starlight](https://starlight.astro.build).

- `/` is the landing page (`src/pages/index.astro`).
- `/docs/...` is the documentation (`src/content/docs/docs/**`).

## Commands

| Command | Action |
| --- | --- |
| `npm install` | Install dependencies |
| `npm run dev` | Start the dev server at `localhost:4321` |
| `npm run build` | Build the static site to `./dist/` |
| `npm run preview` | Preview the build locally |

## Adding a page

1. Create a Markdown file under `src/content/docs/docs/`, e.g. `src/content/docs/docs/features/billing.md`, with a `title` and `description` in its frontmatter.
2. Add it to the `sidebar` in `astro.config.mjs` using its slug (`docs/features/billing`).

Write pages from the kit's current source: use real class, method and config names, and end feature pages with a **Customizing** section.

## Styling

- Docs theme colors: `src/styles/global.css` (`--sl-color-*` variables for dark and light).
- Landing page: `src/styles/landing.css` (Tailwind 4). It follows the docs theme through Starlight's `starlight-theme` preference.
- Logo: `src/assets/logo.svg` (also copied to `public/favicon.svg`).
