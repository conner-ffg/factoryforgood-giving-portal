# Brand fonts — PP Fragment superfamily

The platform is pre-wired for the Factory for Good brand typefaces
(**PP Fragment Glare** for display, **PP Fragment Sans** for text and UI,
per the FFG typography guidelines). The CSS `@font-face` rules already
point at this folder — the fonts activate site-wide the moment the files
below exist. Nothing else needs to change.

## Files to add (exact names)

| File                  | Face                     | Used for                           |
|-----------------------|--------------------------|------------------------------------|
| `glare-regular.woff2` | PP Fragment Glare        | Headlines, large feature text      |
| `glare-italic.woff2`  | PP Fragment Glare Italic | Display emphasis                   |
| `sans-regular.woff2`  | PP Fragment Sans 400     | Body and running text              |
| `sans-italic.woff2`   | PP Fragment Sans Italic  | Emphasis in body copy              |
| `sans-medium.woff2`   | PP Fragment Sans 500     | CTAs, buttons                      |
| `sans-semibold.woff2` | PP Fragment Sans 600     | Headings, UI labels                |
| `sans-bold.woff2`     | PP Fragment Sans 700     | Strong headings, numeric emphasis  |

Missing files are harmless — the site quietly falls back to the current
system stacks until each file appears.

## Where the files come from

PP Fragment is a licensed typeface by Pangram Pangram Foundry
(pangrampangram.com). You need a **Web license** for the weights above —
if FFG already licensed the family for the brand (likely, since the brand
kit specifies it), check the license email / brand-asset drive for the
`.woff2` (or `.otf`) files before buying anything new. Desktop-only
licenses do not cover website embedding, so confirm the license tier
includes web use.

If you only have `.otf`/`.ttf` files, they can be converted to `.woff2`
(smaller, made for the web) — or hand them to Claude in the portal
session and it will convert, rename, and verify them for you.

## After adding the files

Upload this folder with the rest of the repo to GitHub — Vercel serves
`/assets/fonts/…` statically. Hard-refresh the live site and headlines
should render in Glare, body text in Fragment Sans.

Licensing note: keep the font files out of any public marketing of the
repo — the web license covers serving them on your domains, not
redistributing them.
