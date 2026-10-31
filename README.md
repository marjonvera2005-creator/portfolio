# Marjon C. Vera — Developer Portfolio

A personal portfolio website for Marjon C. Vera, a BS Computer Science student at
Biliran Province State University. It presents six projects (IntelliGuide, Tingi, QuiteScan,
CocoScan, CassavaCare, Banana Ripeness Detection), skills, awards, trainings, and contact details.

**Live site:** _add the Vercel URL here after deployment_

Built with plain HTML5, CSS3, and JavaScript. No frameworks and no build step.

## Sections

| Section | What it contains |
|---|---|
| Hero | Name, role, one-line summary, "View my work" button, award highlight, portrait |
| Work | Slideshow of 6 project cards (screenshot, summary, tech); each opens a full case study |
| Skills | Labelled tools grouped into Web & systems, Mobile, and AI & vision |
| About | Bio, quick stats, current focus |
| Awards | The international ML award for academic excellence (certificate + ceremony photos) |
| Trainings | Slideshow of 5 certificates from 4 trainings, each viewable full size, coming forward in 3D |
| Beyond the code | 36 personal photos (Vietnam, outdoors, fitness, campus) in a 3D reel that drifts sideways without stopping, with filters |
| Contact | Email, plus a message form that opens the visitor's email app |
| Mochi | Floating chat assistant (bottom-right) that answers questions about the portfolio |

## File structure

```
index.html            Page markup (semantic HTML5)
css/styles.css        All styles: design tokens, layout, components, responsive rules
js/data.js            Project case-study content and the Beyond the code photo list
js/main.js            Interactivity: theme, menu, gallery, dialogs, form
js/chat-data.js       Mochi's topics, keywords, and answers (content only)
js/chat.js            Mochi chat assistant behaviour
Images/web/           Optimised images used by the site
Images/web/beyond/    Beyond the code photos (thumb/ holds the 360×480 grid thumbnails)
cv/cv.html            Source of the one-page CV (edit, then print to PDF)
cv/Marjon-Vera-CV.pdf The CV linked from the About section
docs/TESTING.md       Cross-browser and device testing record, with fixes
tests/                Automated browser test (Chrome + Edge, 5 screen sizes)
```

## Running it locally

Open `index.html` in a browser. Everything works straight from disk, with no server needed.

## Features

- **Responsive, mobile-first layout:** base styles target phones. Breakpoints at
  600px, 768px, and 1024px add columns as space allows.
- **Light and dark themes:** the site follows the system setting by default and remembers the visitor's choice.
- **Accessible:** semantic landmarks, one `h1` with an ordered heading hierarchy,
  descriptive alt text, a skip link, visible focus rings, keyboard support
  (arrow keys in the gallery, Escape closes dialogs), and `prefers-reduced-motion` support.
- **Section switch:** clicking a menu link (or the logo, hero buttons, or Back to top) changes section
  like changing pages: the content fades out, the page jumps, and the section's heading and content
  rise back in. Under reduced motion it jumps instantly.
- **Slideshows for Work and Trainings:** the longest sections scroll sideways instead of down
  (3 projects at a time on desktop, 2 on tablet, 1 on phones). They use native CSS scroll-snap, so
  swiping, trackpads, and Tab all work, with arrow buttons, a counter, and arrow keys on top.
  Work slides on its own every 5 seconds and loops forward
  without rewinding, with a
  pause button; they hold still while a slide has keyboard focus, a dialog is open, the slider is off
  screen, or reduced motion is on. Trainings only moves when clicked.
- **Photo reel (Beyond the code):** the photos sit in a frame turned in 3D and drift sideways at a
  steady speed, looping forever, with the far edge faded and the near edge softly blurred. Arrows
  nudge one photo; Pause stops the drift. Under reduced motion it lies flat and starts paused.
- **Typed headings:** each time a section is opened from a link (and the first time it scrolls into view), its heading types itself out on one line
  (the font shrinks to fit where needed)
  with a caret (skipped under reduced motion; screen readers get the whole heading at once).
- **Project case studies** open as a dialog with a shareable URL (`#project-…`)
  and close with the browser Back button.
- **Certificate lightbox** for every award and training certificate.
- **Mochi, a scripted chat assistant:** answers questions about projects, skills,
  awards, trainings, availability, and contact using only the portfolio's own content.
  It runs entirely in the browser, so there is no server, no AI service, and no API key.
  Edit `js/chat-data.js` to change what it says.

## Testing

See [docs/TESTING.md](docs/TESTING.md). To re-run the automated test:

```
cd tests
npm install
npm test
```

## Credits

All content, photos, and project screenshots are the author's own. Fonts:
[Archivo](https://fonts.google.com/specimen/Archivo) and
[JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) via Google Fonts.
