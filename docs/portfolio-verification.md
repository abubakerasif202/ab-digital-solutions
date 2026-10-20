# Portfolio verification

Checked 20 October 2026 using public HTTPS GET requests only. All 15 recorded destinations returned HTTP 200 and an expected business title. This verifies availability and brand identity at the time of the check, not ownership, conversion results, browser behaviour or the operation of forms, checkout and private features.

| # | Observed title | Recorded URL | HTTP | Classification |
|---|---|---|---|---|
| 1 | JUFAJA Constructions · Home Designs &amp; Building Enquiries | [Destination](https://jufaja-homes-platform.vercel.app/) | 200 | Hosted showcase |
| 2 | Milestone Renovate · Thoughtful Home Renovations Sydney | [Destination](https://milestonerenovate.com/) | 200 | Published business website |
| 3 | Aftab &amp; Sons Transport · Australian Road &amp; Interstate Freight | [Destination](https://www.aftabandsons.com.au/) | 200 | Published business website |
| 4 | 24/7 Inventory Operations | [Destination](https://247trucktyreservices.store/) | 200 | Private application: public sign-in only |
| 5 | Wholesale Tyres Adelaide · Bulk Tyres &amp; Free Delivery · Adelaide Wholesale Tyres | [Destination](https://adelaidewholesaletyres.com.au/) | 200 | Published business website |
| 6 | 24/7 Truck Tyre Services Adelaide · Roadside Assistance | [Destination](https://www.247trucktyreservices.com.au/) | 200 | Published business website |
| 7 | Premium Driver Car Rentals Sydney · Maple Rentals | [Destination](https://www.maplerentals.com.au/) | 200 | Published business website |
| 8 | Galarentals · Premium Car Rentals Sydney | [Destination](https://www.galarentals.com.au/) | 200 | Published business website |
| 9 | Adelaide Removalists · Home &amp; Interstate Moves · ZQ Removals | [Destination](https://zqremovalsadelaide.com.au/) | 200 | Published business website |
| 10 | Sydney Duplex Builder &amp; Property Development · DECENT Development | [Destination](https://www.decentdevelopment.com.au/) | 200 | Published business website |
| 11 | Milestone Development · Residential &amp; Commercial Construction | [Destination](https://milestonedevelopment.com.au/) | 200 | Published business website |
| 12 | 4Point Concrete Construction Group · Concrete Contractor Girraween NSW | [Destination](https://4point-concrete-website.vercel.app/) | 200 | Hosted showcase |
| 13 | 1st Class Express · Freight, Drivers &amp; Fleet Solutions | [Destination](https://www.1stclassexpress.com.au/) | 200 | Published business website |
| 14 | Removalists Adelaide &amp; Movers · HF Removals Adelaide | [Destination](https://www.hfremovalsadelaide.com.au/) | 200 | Published business website |
| 15 | Cheap Adelaide Removalists · Affordable Adelaide Movers | [Destination](https://www.cheapadelaideremovalist.com.au/) | 200 | Published business website |
| 16 | Fresh Stop — Sydney Fresh Produce &amp; Online Groceries | [Destination](https://fresh-stop.vercel.app/) | 200 | Active preview; excluded |

## Content corrections

- Gala Rentals is available again: removed its stale unavailable flag. The unavailable destination state remains available for future failures.
- Jufaja and 4Point remain labelled hosted showcases; a public Vercel address is not evidence of a completed client-domain launch.
- The inventory URL redirects to /login. Only its public sign-in was inspected; no credentials, internal records or administrative sessions were used. Its CTA now says View Staff Sign-in.
- Removed unsupported 4Point equipment, accreditation and estimator claims. The hosted website explicitly labels concept imagery. Corrected its stack from the contradictory Next.js/Vite list to React, Vite and Tailwind CSS, supported by the nearby 4point-concrete checkout.
- Removed outdated Cheap Adelaide Removalist claims about an automatic crew allocator and an unconditional no-surcharge policy. Its current public site shows starting rates and move-dependent pricing conditions.
- Updated Milestone Renovate imagery wording: its current homepage identifies owner-supplied project photography alongside concept references.
- Removed unsupported ZQ coverage-map and multi-step form claims and DECENT booking/specification claims.
- Homepage portfolio labels now use the canonical destination classification instead of calling every showcase a live client site.

## Technology and asset evidence

Read package manifests from nearby checkouts: jufaja-homes-platform, Aftabandsons/frontend, 247truck/inventory-app, adelaide-wholesale-tyres, maple-rental-clean, Gala-rentals, decent-development, 4point-concrete, 1st, HF, cheapadelaide and milestonedevelopment-site. These support the major framework labels. Installed dependencies do not prove that every feature is used or that the current remote build matches the local checkout. Milestone Renovate's full technology attribution still needs owner confirmation. No screenshots or client artwork were replaced; existing public portfolio captures remain the visual source.

## Fresh Stop decision

The preview responds successfully and describes an enquiry-only grocery catalogue with indicative prices and labelled illustrative product art. Excluded from the public registry: a reachable preview is insufficient evidence of an approved finished launch or portfolio artwork. Obtain owner approval, an accurate preview label and an authentic website capture before adding it.

## Limits and business verification

Confirm permission to publish all project attributions and screenshots, current launch status for the two hosted showcases, and the detailed private inventory feature list. Public availability can change. No client forms, payments, inboxes or private workflows were tested. No delivery or performance outcomes are claimed by this audit.

## Native WSL follow-up — 20 October 2026

Rechecked all 15 registry destinations using public HTTPS GET requests from WSL. Every destination returned HTTP 200 with the expected business title. The inventory destination redirects to `/login`. Machine-readable evidence: `qa/studio-resume-wsl-20261020/portfolio.json`. The earlier Fresh Stop assessment was not repeated and remains an exclusion decision, not a current availability claim.

Contact source review confirms the centralized public defaults: `enquiry@abwebstudio.com.au`, `0423 332 037` (`+61423332037`) and Sydney, NSW, Australia. Header, footer, contact links and structured data consume this configuration. This confirms implementation consistency; mailbox provisioning, phone ownership, client permissions and real email delivery require business confirmation. No real enquiries were submitted.
