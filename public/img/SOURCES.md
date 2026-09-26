# DRISHTI-X image sources (`public/img/`)

Every photographic image on the site carries a visible caption with its
source. Illustrative photos are badged ILLUSTRATIVE IMAGE and are never
presented as live data.

## License-verified production images (`photos/`)

| Filename | Description | Source | License | Verification |
|---|---|---|---|---|
| hero-nilam.jpg | Cyclone over the Bay of Bengal near India, NASA Terra/MODIS, 31 Oct 2012 | Wikimedia Commons `Cyclonic Storm Nilam Oct 31 2012.jpg` | Public domain (NASA) | File page confirms PD-USGov-NASA; magic bytes + dimensions verified on download |
| mission-himalaya.jpg | India and the Himalayas from the ISS | Wikimedia Commons `ISS-64 India, the Himalayas and China.jpg` (ISS064-E-037041) | Public domain (NASA) | File page confirms PD-USGov-NASA-AP; verified on download |
| kerala-before.jpg | Kerala before the Aug 2018 floods (Landsat 8 OLI, 6 Feb 2018) | NASA Earth Observatory record 92669 (1280px rendition) | Public domain (NASA/USGS; Sentinel data via ESA) | Downloaded from assets.science.nasa.gov; verified JPEG |
| kerala-after.jpg | Kerala after inundation (Sentinel-2 MSI, 22 Aug 2018) | NASA Earth Observatory record 92669 (1280px rendition) | Public domain (NASA/USGS; Sentinel data via ESA) | Downloaded from assets.science.nasa.gov; verified JPEG |
| command-eoc.jpg | Emergency operations center coordinating hurricane response | Wikimedia Commons `FEMA - 38184 - Emergency Operations Center in Texas.jpg` | Public domain (FEMA/US federal) | File page confirms PD-US-FEMA; verified on download |
| emergency-rescue.jpg | Helicopter flood rescue, Hurricane Harvey relief | Wikimedia Commons `Hurricane Harvey rescue (37833567051).jpg` | Public domain (U.S. Navy) | File page confirms PD-US-Navy; verified on download |

Remaining `public/img/*.svg` files are original in-repo illustrations.

## Model-flow visuals (`src/components/ml/ModelFlowVisual.tsx`, /ml + /prediction)

No new files downloaded — the flow reuses the verified photos above:

| Card | Asset | Source | License |
|---|---|---|---|
| RAIN (precipitation context) | hero-nilam.jpg | NASA Terra/MODIS ([file page](https://commons.wikimedia.org/wiki/File:Cyclonic_Storm_Nilam_Oct_31_2012.jpg)) | Public domain (NASA) |
| SOIL (land-surface context) | kerala-before.jpg | NASA EO 92669 ([record](https://science.nasa.gov/earth/earth-observatory/before-and-after-the-kerala-floods-92669/)) | Public domain (NASA/USGS) |
| SLOPE/TERRAIN (elevation context) | mission-himalaya.jpg | NASA JSC ISS064-E-037041 ([file page](https://commons.wikimedia.org/wiki/File:ISS-64_India,_the_Himalayas_and_China.jpg)) | Public domain (NASA) |
| HISTORY/REPORTS (before→after) | kerala-before.jpg + kerala-after.jpg | NASA EO 92669 (2018-02-06 / 2018-08-22) | Public domain (NASA/USGS; Sentinel via ESA) |
| WARN/GIS (map preview) | live OSM tile for shared location | © OpenStreetMap ([copyright](https://www.openstreetmap.org/copyright)) | ODbL (attributed in UI) |

Machine-readable registry: `src/data/images/imageRegistry.ts` (validated in tests — missing source/license is rejected). The old static `ml-pipeline.svg` "87/100" score is not used in this view; risk output shows model-registry state only.

## Supplied asset package (`public-exact-format/`, NOT integrated)

A 41-file user-supplied package (30 JPG + 10 SVG + reference PNG) was
inspected file-by-file on 2026-09-24. Finding: **all 30 JPGs are generated
placeholder graphics** (dark-navy background, cyan frame, centered label
such as "HERO CYCLONE" / "KERALA BEFORE", footer
"DRISHTI AI COMMAND CENTER • ASSET PLACEHOLDER") — not real disaster,
satellite, terrain, or response photography. The 10 SVGs are simple labeled
badge icons. Per project policy (real photography only, no placeholders,
verified provenance wins), **none of these files were integrated** and the
existing license-verified images above were retained.

For every supplied file: user-supplied asset — provenance/license not
independently verified. Do not publish without verifying rights.
