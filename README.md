# Jineshwar Industries — website

A single-page, dependency-free marketing site for Jineshwar Industries
(SS 202 stainless steel patta and precision-cut circles, Odhav, Ahmedabad).

Plain HTML, CSS and JavaScript. No build step, no framework. Open
`index.html` in a browser or serve the folder with any static host
(GitHub Pages, Netlify, Vercel, Cloudflare Pages, nginx).

## Structure

```
index.html          page markup and copy
css/styles.css      design system, procedural steel artwork, animations
js/main.js          preloader, reveals, hero canvas, cursor, gallery, form
assets/img/         drop real product photographs here (optional)
assets/video/       drop the hero background video here (optional)
```

## Hero video

The hero plays `assets/video/hero.webm` and/or `assets/video/hero.mp4`
as a muted, looping background. Until a file is present, an animated
brushed-steel canvas renders in its place, so the site looks finished
either way. Suggested spec for the video:

- 1920 × 1080, 10 to 20 seconds, seamless loop, no audio track
- H.264 MP4 (and WebM/VP9 if you can) at 2 to 4 Mbps, under 6 MB
- Footage of circles being cut, coils being slit, or brushed sheet
  under moving light works best; the overlay darkens the left half

### One-command preparation

Download a clip, then run:

```
scripts/prepare-hero-video.sh ~/Downloads/clip.mp4 [start_seconds] [duration_seconds]
```

The script (needs ffmpeg) trims the clip, centre-crops it to 1920 × 1080,
strips the audio, fades the loop point and writes `hero.mp4`, `hero.webm`
and a poster frame into `assets/`. Nothing in the HTML needs changing.

### Candidate clips

All of these are on Pexels, whose licence allows free commercial use
without attribution. Preview each and pick the one that suits;
"Device in Steel Production" is the closest match by description.

- Device in Steel Production: https://www.pexels.com/video/device-in-steel-production-7622785/
- Industrial Machinery at Work in a Factory: https://www.pexels.com/video/industrial-machinery-at-work-in-a-factory-30183217/
- Wide View of Modern Factory Production Line: https://www.pexels.com/video/wide-view-of-modern-factory-production-line-30715848/
- Browse more: https://www.pexels.com/search/videos/stainless%20steel/ and https://www.pexels.com/search/videos/steel%20industry/

## Hosting

Pushing to the site branch runs the GitHub Pages workflow, which serves the
folder at `https://shauryag10.github.io/gkcpl/`. If the first run reports
that Pages is not enabled, open the repository's Settings, choose Pages,
set Source to "GitHub Actions", and re-run the workflow.

## Previewing locally

Any static server works. From the repository root:

```
python3 -m http.server 8000
```

then open http://localhost:8000. Or, with Node installed, `npx serve .`.

## Photographs

Every visual slot has a procedural stainless-steel illustration behind
an `<img>` tag. Add a JPEG at the path below and it takes over
automatically; if the file is missing, the illustration shows instead.

| Path | Slot |
| --- | --- |
| `assets/img/product-patta.jpg` | Products: SS 202 Patta |
| `assets/img/product-circles.jpg` | Products: SS 202 Circles |
| `assets/img/product-patta-to-circle.jpg` | Products: Patta to Circle |
| `assets/img/product-coil-to-circle.jpg` | Products: Coil to Circle |
| `assets/img/step-raw-material.jpg` | Process step 01 |
| `assets/img/step-patta-coil.jpg` | Process step 02 |
| `assets/img/step-cutting.jpg` | Process step 03 |
| `assets/img/step-quality-check.jpg` | Process step 04 |
| `assets/img/step-dispatch.jpg` | Process step 05 |
| `assets/img/spec-coil.jpg` | SS 202 section, large coil |
| `assets/img/gallery-circles-mirror.jpg` | Gallery 1 |
| `assets/img/gallery-circles-brushed.jpg` | Gallery 2 |
| `assets/img/gallery-patta-coil.jpg` | Gallery 3 |
| `assets/img/gallery-patta-narrow.jpg` | Gallery 4 |
| `assets/img/gallery-custom-sizes.jpg` | Gallery 5 |
| `assets/img/gallery-dispatch.jpg` | Gallery 6 |

Square or 4:5 crops around 1200 px wide are ideal.

## Enquiry form

The form validates in the browser and shows a success state. To deliver
enquiries, add a `data-endpoint` attribute to the `<form>` in
`index.html` pointing at a JSON endpoint (Formspree, Basin, a Google
Apps Script, or your own API); the form will POST the fields as JSON.

## Motion and accessibility

All animation respects `prefers-reduced-motion`. The custom cursor,
magnetic buttons and card tilt are only enabled for mouse users. The
site works without JavaScript, with all content visible.
