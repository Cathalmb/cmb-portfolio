import fs from "node:fs";
import path from "node:path";
import { imageSize } from "image-size";

/**
 * Shared photo-collection discovery for the /work/photography section
 * (hub + /portraits + /concerts) and WorkGrid.astro's Photography card.
 *
 * Same fs.readdirSync + process.cwd() pattern already proven in
 * Gallery.astro (see that file's July 14 2026 note): process.cwd() is
 * stable across `astro dev` and a production build, whereas an
 * import.meta.url-relative path breaks once Astro relocates the
 * compiled chunk under dist/. Do not switch this back to import.meta.url.
 *
 * Guarded with existsSync — Cathal hasn't dropped the archive in yet
 * (July 2026), so this returns [] rather than throwing until the two
 * folders below actually exist. Every page/component consuming this
 * must handle an empty array gracefully (no crash, sensible fallback).
 *
 * Drop-in convention: put files straight into
 *   public/images/work/photography/portraits/
 *   public/images/work/photography/concerts/
 * (nested under images/work/ to match the existing per-case-study
 * convention, e.g. public/images/work/bia-energy/ — Cathal placed the
 * real archive here July 16 2026, one level deeper than this file
 * originally pointed at; path updated to match rather than asking him
 * to move ~286 files again.)
 * any .jpg/.jpeg/.png/.webp/.avif file is picked up automatically, no
 * code changes needed. Sorted numerically/naturally by filename, same
 * as Gallery.astro's slide-NN convention — if you want a specific
 * running order, name files 01-whatever.jpg, 02-whatever.jpg, etc.
 * Unordered filenames still work, they just sort alphabetically.
 */

export type PhotoCollection = "portraits" | "concerts";

export interface PhotoItem {
  src: string;
  alt?: string;
}

const IMAGE_EXT = /\.(jpe?g|png|webp|avif)$/i;
const naturalSort = (a: string, b: string) =>
  a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });

export function getPhotoCollection(collection: PhotoCollection): PhotoItem[] {
  const dir = path.join(process.cwd(), "public/images/work/photography", collection);
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((f) => IMAGE_EXT.test(f))
    .sort(naturalSort)
    .map((f) => ({ src: `/images/work/photography/${collection}/${f}` }));
}

/**
 * Re-orders an auto-discovered collection against a PARTIAL curated list
 * of filenames (Cathal, July 21 2026 — /portraits and /concerts grouped
 * in sets of 10, same as the Overview strip, but unlike the Overview
 * this shouldn't stop being "drop a file in, it appears").
 *
 * `order` only needs to cover the filenames Cathal actually cares about
 * arranging — matched items come first, in that exact sequence. Every
 * OTHER item already in `items` (new shoots, or ones simply never listed)
 * is appended afterward in its original order (natural filename sort),
 * so the collection is never missing a photo just because it wasn't
 * hand-placed. Filenames in `order` that don't match anything in `items`
 * (typo, renamed, removed) are silently skipped — same resilience
 * pattern as OVERVIEW_ORDER in PhotographyOverviewStrip.astro.
 */
export function applyOrder(items: PhotoItem[], order: string[]): PhotoItem[] {
  const byFilename = new Map(items.map((item) => [item.src.split("/").pop()!, item]));
  const used = new Set<string>();
  const ordered: PhotoItem[] = [];

  for (const filename of order) {
    const item = byFilename.get(filename);
    if (item && !used.has(filename)) {
      ordered.push(item);
      used.add(filename);
    }
  }

  const rest = items.filter((item) => !used.has(item.src.split("/").pop()!));
  return [...ordered, ...rest];
}

/**
 * REBUILD NOTE (Cathal, July 21 2026 — "the randoms are all filled with
 * gaps and layout issues"): PhotoMasonry.astro used to lay images out
 * with CSS `columns` + `break-inside: avoid`. That's the EXACT trap this
 * codebase already hit and rejected once before — see
 * CaseStudyMasonry.astro's own file header: "column-fill: auto only
 * behaves predictably when the multicol container has a DEFINITE
 * height — with auto/indefinite height ... the spec falls back to
 * balancing columns by height regardless of what's set... CSS multicol +
 * break-inside-avoid has known cross-browser inconsistencies with
 * variable-height children." CaseStudyMasonry was rebuilt around that
 * lesson months ago; PhotoMasonry repeated the original mistake because
 * it's a different component. Concretely: the browser estimates an
 * "ideal" column height by averaging total content over the column
 * count, then can't split a break-inside:avoid item that doesn't fit the
 * remainder of that estimate, so it jumps the WHOLE item to the next
 * column — leaving the gap behind. Curated, evenly-paired sets can
 * dodge this by luck; an unpredictable mix of portrait/landscape photos
 * (exactly what "auto-appended" or "random" means here) reliably breaks
 * it, which is why the gaps only showed up in the uncurated portion.
 *
 * getAspectRatio() + distributeColumns() below replace CSS `columns`
 * with the same explicit, author/code-controlled column assignment
 * CaseStudyMasonry already proved out — just computed automatically
 * from each image's REAL pixel dimensions instead of hand-authored, so
 * PhotoMasonry can still auto-flow a 170+ photo archive. Each column is
 * a genuinely separate flex child; there is no shared row grid, no
 * balance heuristic, and nothing for a "random" future photo to break.
 */

const aspectRatioCache = new Map<string, number>();

/**
 * Reads a photo's real height/width ratio directly off disk at build
 * time (via `image-size`, a zero-dependency, synchronous library — no
 * network, no client-side cost). Cached per src for the lifetime of the
 * build process. Falls back to a neutral 1:1 ratio if the file can't be
 * read (never breaks the build over one bad/missing image).
 *
 * CALLED AGAIN (Cathal, July 21 2026, third pass) — distributeColumns()
 * needs each photo's real aspect ratio again to balance column HEIGHT,
 * not just item count. See distributeColumns()'s own comment for why
 * count-based assignment wasn't enough: it left the auto-appended,
 * uncurated remainder visibly uneven, since natural-sort filename order
 * has nothing to do with a photo's actual orientation.
 */
export function getAspectRatio(src: string): number {
  const cached = aspectRatioCache.get(src);
  if (cached !== undefined) return cached;

  let ratio = 1;
  try {
    const filePath = path.join(process.cwd(), "public", src);
    const buffer = fs.readFileSync(filePath);
    const { width, height } = imageSize(buffer);
    if (width && height) ratio = height / width;
  } catch {
    // Missing/corrupt/unreadable file — keep the neutral fallback.
  }

  aspectRatioCache.set(src, ratio);
  return ratio;
}

/**
 * HEIGHT-BALANCED greedy bin-packing: walks payloads IN ORDER and drops
 * each one into whichever column currently has the smallest accumulated
 * height (via `getWeight` — each photo's real aspect ratio, see
 * getAspectRatio() above). This is what an actual masonry grid does,
 * including the portfolio.cathalmb.com reference site Cathal built this
 * against.
 *
 * THIRD REWRITE (Cathal, July 21 2026). History, shortest version:
 *   1. Round-robin (`i % columnCount`) — balanced item COUNT per column,
 *      but scattered Cathal's curated pairs across different columns.
 *   2. Equal-count contiguous chunking — fixed the pairing (adjacent
 *      curated items land in the same column again), but said nothing
 *      about actual photo HEIGHT, so the auto-appended/uncurated
 *      remainder still looked visibly uneven: "wherever you've auto
 *      placed the remainder is still showing gaps."
 * Cathal then confirmed he doesn't need his full curated order preserved
 * item-for-item — only a handful of top-of-page favourites need to stay
 * first. That removes the hard constraint #2 was solving for, so greedy
 * height-balancing (this version) is the right tool: it still processes
 * payloads in the order it's given, so pinned favourites (first in the
 * array) still land at the top of the page same as before, but is free
 * to balance everything else purely by real height — which is what
 * actually eliminates gaps for auto/uncurated content. A difference in
 * per-column ITEM COUNT is normal and expected here, same as any real
 * masonry grid, as long as column HEIGHTS stay balanced.
 *
 * Still fully gap-proof for the structural reason unchanged since the
 * first rebuild: each column is a genuinely separate flex child (see
 * PhotoMasonry.astro's `.pm-col`), and a column's rendered height is
 * simply the sum of whatever real photos land in it — there's no shared
 * row grid, no CSS balance heuristic, nothing to leave a blank hole
 * behind.
 *
 * SMALL-GROUP CAVEAT, discovered the same day on the Overview strip
 * ("smaller screen sizes are showing gaps"): order-preserving greedy
 * only balances well when there's enough material to redistribute —
 * fine for portraits/concerts (one continuous flow across the whole
 * ~150+ photo archive), but the Overview strip's small hand-curated
 * `groupSize={6}` blocks can land badly at mobile's 2-column layout
 * (only 3 photos/column): measured a real [2, 4] item split and 604px
 * height gap between columns in one group. `sortForBalance` (below)
 * is the fix for exactly that case — see its own note.
 */
export function distributeColumns<T>(
  payloads: T[],
  columnCount: number,
  getWeight: (item: T) => number = () => 1,
  /**
   * When true, sorts a COPY of `payloads` by descending weight before
   * bin-packing (a standard "longest processing time first" scheduling
   * improvement) instead of assigning in the given order. Trades exact
   * input order for far more reliable balance — the right trade for a
   * SMALL, already-curated group (e.g. Overview's groupSize={6} blocks)
   * where there isn't enough material for plain order-preserving greedy
   * to recover from one unusually tall or short photo, and where exact
   * intra-group sequencing matters far less than not showing a visible
   * gap. Leave false (default) for a large continuous flow — e.g.
   * portraits/concerts — where order-preserving greedy already balances
   * well AND preserving order matters (pinned favourites must load
   * first).
   */
  sortForBalance = false,
): T[][] {
  const count = Math.max(1, columnCount);
  const columns: T[][] = Array.from({ length: count }, () => []);
  const heights = new Array(count).fill(0);
  const ordered = sortForBalance ? [...payloads].sort((a, b) => getWeight(b) - getWeight(a)) : payloads;

  for (const payload of ordered) {
    let shortest = 0;
    for (let c = 1; c < count; c++) {
      if (heights[c] < heights[shortest]) shortest = c;
    }
    columns[shortest].push(payload);
    heights[shortest] += getWeight(payload);
  }

  return columns;
}
