# Gilt & Ruby upgrade: validation gate

Baseline: merged PR #28, commit `bc56f2141ec0855b734198a6d8e049bad2101ac2`.
Inspection and test: 2026-10-29 UTC. Production source was not changed or deployed.

## Authorized contact test

Exactly one enquiry was submitted through the real production `/contact` HTML form
using desktop Chromium. Marker: `AB-STUDIO-QA-20261029-GILT-RUBY`.
Submission time: 12:41:58 UTC (test start). The response was HTTP 200 `{ "ok": true }`;
the UI displayed “Enquiry received”. The existing API only reports success after
Resend returns an acceptance ID. This establishes provider acceptance, not delivery.

Evidence: `qa/gilt-ruby/authorized-enquiry.json` and
`qa/gilt-ruby/authorized-enquiry.png`. No second submission or retry was made.
The reply address was the site's published enquiry address, and the body explicitly
identified this as an internal authorized test requiring no sales follow-up.

The connected Resend account exposes only `freshstop.com.au`; its recent sent
records contain no matching test. An exact-marker search in the owner's connected
Gmail returned no messages. Neither account establishes the receiving mailbox's
state. AB's Resend delivery event or receiving mailbox confirmation is required.
The user subsequently supplied an iPhone Mail screenshot showing the received
message addressed to `enquiry@abwebstudio.com.au`, the matching test subject and
`AB-STUDIO-QA-20261029-GILT-RUBY` marker in its body. Mailbox delivery is therefore
confirmed by user-supplied visual evidence. This does not establish showroom
behavior in Safari or physical GPU performance. No further test enquiry is needed.

## Physical device gate

No physical iPhone/Safari session, connected phone, or physical-device lab is
available through the current tools. No physical-device result is claimed.
Desktop Chromium, Playwright device emulation and desktop WebKit cannot substitute
for the user's required physical-device validation or GPU activation benchmark.
The user explicitly authorized continuing the upgrade with these physical-device
checks pending. The initial production baseline remains recorded separately;
local visual development and software-GPU comparison may proceed.

For a physical baseline and subsequent comparison, record:

- Device model, iOS/Safari version, low-power mode, network and cache conditions.
- Three cold and three warm activations from Enter the Studio to visible, interactive
  scene; retain raw samples and report medians separately.
- Intro/Skip, all four rooms, 16-project selector, project displays, tour/pause,
  horizontal drag, pinch, vertical page scrolling, panel close and navigation.
- Portrait/landscape screenshots, reduced motion, still view, exit/re-entry,
  context failure where feasible, keyboard/VoiceOver and quote navigation.
- Frame timings during the same camera route, idle behavior and thermal state.

## Planned implementation scope after the gate

Retain the state machine, all content/SEO, HTML panels, failure recovery, DPR caps,
demand rendering and native vertical scrolling. Refine original architecture,
procedural marble/brass, ruby upholstery, furniture silhouettes and room composition.
Improve camera framing and mobile affordances. Do not add postprocessing, dynamic
shadows or environment downloads without measured justification.

Capture new baseline screenshots and repeatable local measurements before edits;
keep them separate from the PR #28 QA artifacts. Compare after the changes using
the same browser, viewport, network/CPU conditions, camera route and sample count.
Run focused regressions, full verify/build and existing Playwright coverage, adding
behavioral regressions for changed interactions. Physical testing remains a separate
required evidence item. No deployment is authorized by this task.

## Local upgrade outcome

The user authorized proceeding with physical-device checks pending. The local
refinement, regression suite and before/after lab comparison are now complete;
see [Gilt & Ruby report](gilt-ruby-report.md). Build, 99 Node tests and the final
16-test browser suite passed. No push, commit or deployment was performed.
