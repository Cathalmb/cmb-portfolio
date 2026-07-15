# cathalmb.com — Astro rebuild (branch: `redesign-astro`)

Fresh build on **Astro 5 + Tailwind v4**, replacing the previous Eleventy site
(now preserved under `_legacy/`). Content will be in-code MDX to start, with a
path to Sanity later.

## Run it locally

The old `node_modules/` belongs to the Eleventy build. Remove it and install fresh:

```bash
rm -rf node_modules
npm install
npm run dev
```

Then open http://localhost:4321 — you should see the **foundation-check page**:
hero-scale type, the full type scale, the neutral + ochre colour swatches, and
the 12-column grid (both a 12×1 ruler and responsive 12→6→4 cards).

Build / preview production output:

```bash
npm run build
npm run preview
```

## Add the typeface

The system is wired for **Neue Montreal, single weight (Medium / 500)**. Drop the
licensed file here and it activates automatically:

```
public/fonts/NeueMontreal-Medium.woff2
```

Until it's added, the fallback stack (Helvetica Neue / Arial) renders, so nothing
breaks. If your licence filename differs, update the `@font-face` `src` in
`src/styles/global.css` and the `<link rel="preload">` in `BaseLayout.astro`.

## Push the branch

Done from your machine (the tooling here has no GitHub access):

```bash
git add -A
git commit -m "Scaffold Astro + Tailwind v4 foundation; move Eleventy site to _legacy"
git push -u origin redesign-astro
```

Vercel deploys `main`, so this branch won't touch production until you open a PR
and merge. You can also point a Vercel preview at the branch to see it live.

## How the system is wired

- **`src/styles/global.css`** — the design tokens *are* the Tailwind theme
  (`@theme`). Colours → `bg-n900`, `text-ochre`, etc. Type scale →
  `text-display-lg` … `text-micro` (size + line-height + tracking baked in).
- **8px grid** — `--spacing` is set to `8px`, so `p-1`=8, `p-2`=16, `p-3`=24
  (mobile gutter), `p-6`=48 (desktop gutter). `p-0.5`=4px is the only half-step.
- **Breakpoints** — mobile-first. Base = ~390px, then `md:`768 `lg:`1024 `xl:`1440.
- **Primitives** — `Container` (max 1280 + gutters), `Grid` (12-col), `Section`
  (vertical rhythm + tone). Build sections from these.

## Structure

```
src/
  styles/global.css          design tokens as Tailwind theme
  layouts/BaseLayout.astro   <head>, fonts, global slot
  components/
    primitives/              Container, Grid, Section
    ui/                       (atoms — Button, Tag… to come)
    sections/                 (Hero, WorkGrid, Services… to come)
  pages/index.astro          foundation-check (delete once real sections land)
_legacy/                     previous Eleventy site (reversible, not deleted)
```

## Gotcha to remember

Tailwind v4 only generates a utility when its **full class name appears
literally** in the source. Don't build class names dynamically
(`` `bg-${x}` ``) — write them out in full, or the styles silently won't appear.
