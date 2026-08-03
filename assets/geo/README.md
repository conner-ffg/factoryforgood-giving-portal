# Map boundary data

The dashboard globe draws country boundaries from `countries-110m.json`
(the world-atlas 2 dataset). The app looks for a self-hosted copy here
FIRST, then falls back to the jsDelivr CDN.

To make the globe fully self-contained (recommended), download the file
once and commit it here as `countries-110m.json`:

    https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json

(~110 KB, public domain — derived from Natural Earth.)
