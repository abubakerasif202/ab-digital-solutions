# Studio controls

Open `/studio`, or choose **Explore the Studio** in the homepage preview.
The existing main-site navigation remains available above the experience.

- **Enter the Studio** loads Three.js, the small GLB and the three display
  textures on demand. No sound plays. **Skip Intro** or Escape bypasses the
  opening camera move.
- **Reception**, **Portfolio gallery**, **Services atelier** and **Consultation
  lounge** buttons move the camera and open the associated HTML panel. The
  same spaces have labelled, clickable HTML hotspots inside the scene.
- Drag horizontally or vertically with a mouse to orbit. On touch devices,
  drag horizontally to orbit and pinch with two fingers to zoom. Vertical
  swipes and mouse wheels scroll the page normally. Panning is constrained
  so the architecture stays discoverable.
- The three physical project displays open their corresponding projects in
  the gallery panel. Its project selector exposes all 16 canonical case
  studies. **Open Project** opens the existing case study; that page explains
  the project's available destination, including hosted showcases.
- Click a service sculpture to open its service. The selector exposes web
  design, SEO, branding and AI automation. CTAs use existing service routes
  or `/contact`.
- **Guided tour** visits the four spaces, spending 6.5 seconds at each and
  ending with the consultation panel. **Pause tour**, Escape or direct
  navigation interrupts it. Orbit input takes control from the tour.
- **Close ×** or Escape closes a panel and restores keyboard focus to its
  space button. Tab navigation remains ordinary; panels are nonmodal and
  never trap focus. Room selection frames the studio below the sticky header.
- **Get a Quote** uses the existing `/contact` form. There is no new form,
  enquiry API, pricing or delivery provider.
- **Use still view** releases the canvas and returns to the poster. **Exit
  Studio** goes to the existing homepage. Ordinary site navigation also works.
- Reduced-motion preferences, Save-Data and 2G connections default to the
  still image and HTML content. GPU failures, lost WebGL contexts and loading
  failures also retain all project, service and contact links. **Try 3D again**
  clears failed model/texture cache entries before retrying.
- **Explore without 3D** jumps to server-rendered content. With JavaScript
  disabled, the project directory, service links and contact destination are
  still available. With JavaScript enabled but WebGL unavailable, the same
  HTML panels remain usable.

The render loop runs on demand, animates during camera moves and the short
intro, and suspends when the scene is hidden or offscreen. Tour timers pause
while offscreen. There are no scroll locks or background audio controls.
