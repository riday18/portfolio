# riday.space portfolio

Personal portfolio for Riday Raheja, a 3D artist (product visualization, motion graphics, interior and event visualization). Replacing an old Adobe Portfolio site. Domain: riday.space.

## Stack

- Plain static site: `index.html`, `style.css`, `app.js`. No build step, no framework. Keep it that way.
- Content lives in `content/site.json`, `content/projects.json`, `content/experience.json`.
- Decap CMS admin at `/admin` (`admin/index.html`, `admin/config.yml`) edits those JSON files through GitHub. Uploads go to `uploads/`.
- Hosting plan: GitHub repo `portfolio` + Netlify (free), Netlify GitHub OAuth for the admin login.
- Preview locally with `python3 -m http.server` and open http://localhost:8000. Opening index.html directly won't load the JSON.

## Design

- Source of truth: Figma file https://www.figma.com/design/gOoVYw4R4R1XV59BMonLDO/website
  - Frame "home page" (2:3): landing page.
  - Frame "Animations" (11:7): collage tiles and the hover state.
- Mostly a one-pager with a decent scroll: landing (work) → about (includes operations roles) → contact.
- Black background, Inter. Navbar: 111px black bar (at 1920 wide) with `box-shadow: 0 4px 59.2px rgba(255,255,255,0.25)`; links "work / contact / about" left, glowing "riday.space" logo centred (Inter Black, white text-shadow), Instagram / LinkedIn / Mail icons right. Active link glows.
- Intro under the navbar: round profile photo + the intro text, centred.
- Sizes scale from the 1920px Figma frame using clamp().

## Landing animation and collage (the main feature)

- Riday is making an animated .webp of a desk with a PC setup popping in. The monitor sits in the centre of the screen with one of his artworks on it. The webp covers only the desk popping in.
- After the webp ends, project images pop in around the monitor as a real web animation (not part of the webp), forming a non-uniform collage.
- Collage rules:
  - Each project has a **relevance** rating (1 to 10) set in the admin. Higher relevance = bigger and closer to the monitor.
  - Tiles keep each image's real aspect ratio (images come in mixed sizes and ratios).
  - Size falls off with distance from the monitor. Falloff strength, falloff curve and minimum size are adjustable, plus a randomness factor.
  - On wide (16:9-ish) screens the collage spreads mostly horizontally; on tall (9:16-ish) screens mostly vertically. Size keeps decreasing further out.
  - Tiles have a very slight constant floaty animation and are gently pushed by the cursor.
  - Hover: image scales up slightly and gets a soft blurry halo (a blurred copy of the image behind it, as in the Figma "Animations" frame).
  - The layout regenerates automatically when projects are added, removed or re-rated in the admin.
- Implementation notes (app.js):
  - Layout: projects sorted by relevance (with randomness jitter), each placed at the nearest free spot to the monitor, searching outward along ellipses stretched by the viewport aspect ratio. Rectangles must avoid the monitor, the intro block and `scene.clear_areas` (desk, PC tower).
  - All tuning values live in `site.json` → `collage` and `scene`, and are exposed in the admin under Site settings.
  - Adding `?tune` to the URL opens a live slider panel with a falloff-curve graph.
  - Until the real desk webp is uploaded, a stand-in desk SVG is drawn. When the webp arrives, set `scene.monitor_*` (monitor screen box in % of the webp) and `scene.clear_areas` to match it.
  - Respect `prefers-reduced-motion` (no float, no pop-in).

## Content rules

- About section: short bio, design roles list (Spalba, Swadesh, Designbox), then an operations block (Katalyst Sports, Legends League Cricket). Roughly 65% weight on 3D/design, 35% on operations.
- The site is a showcase of past work. No "hire me", "available for commissions" or pricing buttons. Contact section just shows email and socials.

## Still to do

- Replace `YOUR-GITHUB-USERNAME/portfolio` in `admin/config.yml` with the real repo.
- Push to GitHub, deploy on Netlify, set up the GitHub OAuth app for the admin, then point riday.space at Netlify (do the domain switch last).
- Upload the real profile photo, desk webp and artwork images (they're in the Figma file but couldn't be exported yet).
- Add the LinkedIn URL in Site settings (the icon stays hidden until then).
- Relevance ratings and project years in `projects.json` are first guesses; Riday will correct them.
- Once the desk webp exists: fit the monitor box and clear areas to it, and set `scene.duration_ms` to its length.
