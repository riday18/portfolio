# riday.space portfolio

A fast, free-to-host site with a web admin for adding projects.

## What's in the folder

- `index.html`, `style.css`, `app.js`: the site itself (design lives in `style.css`)
- `content/`: your projects, roles and intro text (the admin edits these for you)
- `uploads/`: images and videos you upload through the admin
- `admin/`: the page where you add and edit projects

## One-time setup (about 30 minutes)

1. **Put it on GitHub.** Create a free GitHub account, make a new repository called `portfolio`, and upload this whole folder to it.
2. **Edit `admin/config.yml`.** Replace `YOUR-GITHUB-USERNAME/portfolio` with your real username and repository.
3. **Host it on Netlify (free).** Sign up at netlify.com with GitHub, choose "Add new site", then "Import an existing project", and pick your repository. Leave the build command empty and set the publish directory to `/`.
4. **Allow the admin to log in.**
   - On GitHub: Settings, Developer settings, OAuth Apps, New OAuth App. Set the homepage to your Netlify site and the callback URL to `https://api.netlify.com/auth/done`.
   - On Netlify: Site configuration, Access and security, OAuth, Install provider, GitHub. Paste in the Client ID and Secret from GitHub.
5. **Point riday.space at the new site.** Build and test everything on the Netlify address first. Then, in Netlify, add `riday.space` under Domain management and follow the DNS instructions at your domain registrar. You'll need to disconnect the domain from Adobe Portfolio first. Do it last so the old site stays live until the new one is ready.

## Adding a project (the everyday bit)

1. Go to `riday.space/admin` and log in with GitHub.
2. Open Projects, then All projects, and click "Add project".
3. Fill in the title, relevance (1 to 10), year and category. Upload the collage image, and optionally an animated preview that plays on hover.
4. Under "Images and videos", add as many items as you like: images (animated `.webp` works), YouTube or Vimeo links, or short `.mp4` files.
5. Click Publish. The site updates in about a minute.

## The landing collage

- Every project needs a **Relevance** rating from 1 to 10 in the admin. Higher means bigger and closer to the monitor.
- The collage lays itself out again whenever a project is added, removed or re-rated.
- To tune it, open your site with `?tune` on the end of the address (for example `riday.space/?tune`). Sliders change the layout live on your screen only. Copy the numbers into Site settings, Collage to keep them.
- **Falloff strength** sets how fast images shrink away from the monitor. **Falloff curve** sets the shape: below 1 shrinks fast then levels off, above 1 stays big then drops. **Smallest size** is the floor.
- **Randomness** shuffles order, size and position a little. **Layout number** picks a different arrangement with the same settings.

## Adding your desk animation

1. Export the desk animation as an animated `.webp` that plays once (not looping), with the monitor in the middle.
2. In Site settings, Desk animation: upload it, and set the animation length in milliseconds. The collage starts when it ends.
3. Measure where the monitor screen sits in your animation, in % of its width and height, and fill in the four Monitor screen fields. The collage centres on that box.
4. Update "Areas to keep clear of images" so the collage doesn't cover your desk and PC. The defaults match the stand-in desk.
5. If the first artwork is part of the animation, leave "Artwork on the monitor" empty. Otherwise upload it there and it fades in on the screen.

## Tips for media

- Collage images: any shape, around 1600px on the long side, `.webp` or `.jpg`.
- Animated previews: keep each under about 2 MB. The desk animation can be larger, but under about 8 MB keeps the first load quick.
- Long videos: upload them to YouTube or Vimeo and paste the link. Only upload `.mp4` files for short clips.

## Previewing on your own computer

Opening `index.html` by double-clicking won't load the content. Run `python3 -m http.server` in this folder and visit `http://localhost:8000`.

## Notes

- The desk, profile photo and artwork in the Figma file aren't in this folder yet. Add them through the admin.
- Project years and relevance ratings are first guesses. Correct them in the admin.
- Projects without an image show a dark tile with the title, like the placeholders in the Figma file.
