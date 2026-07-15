# Fonts

Drop the licensed typeface here:

```
NeueMontreal-Medium.woff2
```

That exact filename is what `src/styles/global.css` (`@font-face`) and the
`<link rel="preload">` in `BaseLayout.astro` expect. Once it's in place the site
renders in Neue Montreal Medium; until then it falls back to Helvetica / Arial.

Single weight only (Medium / 500) — no other weights are used.
