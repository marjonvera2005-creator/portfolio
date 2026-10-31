# Testing Record

## Environments

| Browser | Engine | Sizes tested |
|---|---|---|
| Google Chrome | Chromium | 360×740, 390×844 (phone), 768×1024 (tablet), 1024×768, 1440×900 (desktop) |
| Microsoft Edge | Chromium | same five sizes |
| Phone emulation | Touch + mobile viewport | 360 and 390 wide |

> Before submitting, also open the live URL on a real phone and record the result in the table at the bottom.

## Automated checks (`tests/browser-test.js`)

Each browser/size combination checks the following:

1. No horizontal scrolling, and no element extends past the screen edge
2. Exactly one `h1` and no skipped heading levels, including inside the project dialog
3. Every in-page link (`href="#…"`) points to an element that exists
4. Every image loads, and every image has an `alt` attribute
5. Navigation is reachable: desktop links at ≥1024px, menu button below that
6. Mobile menu opens, and closes when a link is chosen
7. All six project cards render, and each opens its case study
8. Project dialog opens, shows its screenshot, doesn't scroll sideways, and closes with Escape
9. Certificate lightbox opens with the image and closes with Escape
10. Contact form rejects an invalid email address with a visible message
11. Theme toggle switches light ↔ dark
12. No JavaScript errors and no failed requests
13. A shared case-study link (`index.html#project-cassavacare`) opens that case study on load
14. Closing a case study returns to the same scroll position in Selected work
15. Mochi: the button is on screen, the chat opens with suggested questions, and the panel fits the screen with no sideways scroll
16. Mochi answers a suggested question, a typed question, a named project, and "why should we hire Marjon?"; says it doesn't know a fact the portfolio doesn't state (graduation date); and gives the fallback reply to an unrelated question
17. Mochi closes with Escape, and opening the message form closes Mochi so the two corner panels never overlap
18. Both slideshows (Work and Trainings): Previous starts disabled, Next moves the slides and updates the counter, and Previous brings them back. Slides waiting off to the side are excluded from check 1; the slideshow track itself is still checked for overflow.
19. Section switch: a menu link lands its section's heading just under the nav bar, updates the address, and moves focus to the section

**Latest result (15 Oct 2026, after adding the slideshows and the section switch): 10/10 combinations PASS.**

```
chrome phone-360     PASS      edge phone-360     PASS
chrome phone-390     PASS      edge phone-390     PASS
chrome tablet-768    PASS      edge tablet-768    PASS
chrome laptop-1024   PASS      edge laptop-1024   PASS
chrome desktop-1440  PASS      edge desktop-1440  PASS
```

HTML validation (`html-validate`): **0 errors**.

## Bugs found and fixed

Rows 13–16 came from the design polish pass (hero, project cards, skill groups, featured award).

| # | Problem | Where | Fix |
|---|---|---|---|
| 1 | "Hire Me" button pushed off-screen on phones | Nav, ≤390px | The button now appears from 600px up. On phones, Contact is in the menu. |
| 2 | Portrait completely invisible when the site was opened as a local file | Hero, all browsers | The background cut-out used a CSS `mask-image`, which browsers block for `file://` pages. The transparency is now built into `hero.webp`, so no mask is needed. |
| 3 | Visitors could not see who the site belongs to on first load (the `h1` was screen-reader only) | Hero | Added a visible name and role. It sits in normal flow above the portrait on phones (so it never covers the face) and floats beside it on desktop. |
| 4 | Opening a project added a second `h1` to the page | Project dialog | The dialog title is now an `h2`. |
| 5 | Invalid HTML: `<dt>`/`<dd>` inside `<a>` | Contact list | Rebuilt as `<ul><li><a>`. |
| 6 | "Download resume" and social links went nowhere (`href="#"`) | About, Contact | Dead links removed. Contact rows only render when they have a real URL. |
| 7 | Centre gallery card could not be reached with Tab | Work gallery | Every visible card is now focusable, with a label saying what it does. |
| 8 | Contact form accepted malformed emails | Message panel | Uses the browser's `type="email"` validity check and shows a specific message. |
| 9 | Skill icons spread out vertically on desktop | Skills | Grid rows aligned to the top. |
| 10 | "Web & Systems Development" label touched the card edge on phones | Skills | Label width increased. |
| 11 | Award section showed "Photo coming soon" placeholders in the HTML | Awards | The real ceremony photos are now in the markup, with alt text. |
| 12 | Validator errors: buttons without `type`, an empty heading, an `<img>` without `src` | Various | All fixed. |
| 13 | Shared `#project-…` links changed the address but did not open the case study | Project dialog | The page now opens the matching case study on load, and closing it clears the address instead of leaving the site. |
| 14 | Portrait phone screenshots stretched their card's image box past 16:10 | Work cards | `overflow:hidden` on the image box, so every card's image area is the same height. |
| 15 | Banana ripeness stage labels were coloured text (yellow on white is about 1.8:1) | Project dialog | The label is now dark text, with the stage colour shown as a small swatch beside it. |
| 16 | `aria-label` on a plain list (validator error) | Awards photos | Removed. |
| 17 | Closing a case study (Back button, Escape, or browser Back) jumped to the top of the page instead of returning to Selected work | Project dialog | The page is frozen while a case study is open, so the browser recorded a scroll position of 0 and restored it on Back. Set `history.scrollRestoration = 'manual'` so the site returns the visitor to the card they opened. Now checked by the automated test. |
| 18 | Decorative icons inside buttons (theme, menu, close, certificate arrows) were read aloud by screen readers | Nav, Trainings, dialogs | Marked `aria-hidden="true"`; each button already has a text label or `aria-label`. |
| 19 | With JavaScript off, the project list and contact list were empty, and "Send me a message" did nothing | Work, Contact | Added `<noscript>` fallbacks listing the projects, email, and GitHub; the message button is hidden without JavaScript. |
| 20 | The slideshow's Next button sat at the bottom-right of the section, exactly where the floating Mochi button is, so on phones Mochi could cover it | Work, Trainings slideshows | The arrow buttons now sit on the left, before the counter. |

## Manual checks on a real device (fill in after deploying)

| Device / browser | Date | Result | Notes |
|---|---|---|---|
| | | | |
| | | | |
