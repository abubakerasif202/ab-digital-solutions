# Cinematic footage — mounted V3 recovery ledger

## Current state and evidence boundary

The mounted `CinematicMedia` base is `/cinematic/sydney-ruby-v3`. The homepage also references `sydney-plate-arteries.webp` and `sydney-plate-harbour.webp`; `sydney-plate-skyline.webp` exists as a related prepared asset, but was not found referenced in the current homepage or its cinematic styles during this audit. The existing V2 studio film remains a separate production described in the historical record below.

This ledger records the actual V3 bytes inspected on 2026-11-15 (Australia/Sydney). No application code, stylesheet or media bytes were changed during provenance recovery.

V3 is **not sourced from the V2 Daniel Shepherd / David Pickup / Reel Focus masters**. Its authoring records identify three different recorded-video downloads from Pexels. The photographic plates are extracted and graded frames from those same videos, not independently sourced photographs. No evidence of AI generation was found in the recovered V3 processing recipe; this statement concerns the recorded recipe, not an independent forensic guarantee about an uploader's source material.

Recovered evidence consists of the existing local authoring transcript's successful public-download results, the `encode-hero.ps1` recipe, its invocation, and the plate-extraction command. Those records identify the exact source IDs, source metadata and transformations below. The temporary source masters and render scratch directory no longer exist at their recorded location. Consequently this recovery did **not** rerender the assets or compare source-master hashes; it must not be described as a reproducible bit-for-bit source verification. Current output hashes are provided independently.

## V3 source ledger

The authoring record reported HTTP 200 downloads through the public Pexels download endpoints. The following final CDN targets were observed in that record, not guessed from filenames.

| Pexels identity / role | Observed final download target | Source metadata reported by ffprobe in the authoring record |
|---|---|---|
| `18092659` — harbour bridge / first hero shot / harbour plate | `https://videos.pexels.com/video-files/18092659/18092659-hd_1920_1080_25fps.mp4` | 1920×1080, 25fps, 16.720000s; downloaded file 12,651,089 bytes |
| `16073006` — urban traffic arteries / second hero shot / arteries plate | `https://videos.pexels.com/video-files/16073006/16073006-hd_1920_1080_25fps.mp4` | 1920×1080, 25fps, 10.000000s; downloaded file 7,597,246 bytes |
| `3760621` — skyline / third hero shot / skyline plate | `https://videos.pexels.com/video-files/3760621/3760621-hd_1920_1080_30fps.mp4` | **1280×720**, 30000/1001fps, 10.010000s; downloaded file 3,069,977 bytes. The actual recorded dimensions differ from the resolution label in the CDN filename. |

**License and attribution boundary:** the [Pexels License](https://www.pexels.com/license/) was independently checked during recovery. It permits website use and modification, does not require attribution, and forbids implying endorsement or using stock imagery as a trademark. However, the individual V3 clip pages, creator names and clip-specific rights assertions were **not independently revalidated** in this recovery: the available page/search tooling did not resolve those IDs. The recovered download records support their Pexels origin, but are not a substitute for uploader-specific release or third-party-rights verification. Do not invent creator credits, assert an exclusive commissioned shoot, or transfer the V2 author names to these V3 clips. Retain this limitation if a campaign requires additional clearance.

## Recovered V3 processing recipe

The existing recipe builds three five-second source extracts in this order: `18092659.mp4` from 00:03, `16073006.mp4` from 00:02, and `3760621.mp4` from 00:01. It converts to 24fps and applies a restrained digital push-in of approximately 5.5% per five-second shot. Crossfades last 0.7 seconds at offsets 4.3 and 8.6 seconds, with additional beginning/end fades. Measured delivered duration is approximately 13.584 seconds; it is not the V2 twelve/eight-second split.

Recovered hero grade: `hqdn3d=2:1.5:6:6,eq=contrast=1.09:saturation=1.24:gamma=1.05,colorbalance=rs=0.07:bs=0.04:rm=0.035:bm=0.02,unsharp=5:5:0.5`. This is denoising, colour/contrast adjustment and sharpening of downloaded footage, not a newly filmed scene. The desktop third shot is enlarged from a 1280×720 source; do not represent every original as native 4K.

| Variant | Output | Source crop rectangles, in shot order |
|---|---|---|
| Desktop | 1600×900 | `1680:945:160:60`; `1800:1012:60:34`; `1150:647:130:40` |
| Mobile | 540×960 | `608:1080:478:0`; `608:1080:520:0`; `405:720:360:0` |

V3 mobile is therefore an art-directed **portrait crop of the landscape sources**, not the V2 native-portrait David Pickup footage. The recovered MP4 recipe uses H.264 High, slow preset, CRF 25 / 26 and maximum rates 1700k / 900k, 3M buffer, yuv420p and fast-start. WebM uses VP9 CRF 37. `-an` removes audio. Posters are extracted at 1.6 seconds from the corresponding V3 MP4, WebP quality 78.

### Photographic plates

The recovered plate command uses `hqdn3d=3:2:6:6` followed by the same contrast, saturation, gamma, colour balance and sharpening values as above.

| Plate | Recovered source and operation |
|---|---|
| `sydney-plate-arteries.webp` | Frame at 00:05 of `16073006.mp4`; crop `864:1080:470:0`; WebP quality 80. |
| `sydney-plate-harbour.webp` | Frame at 00:06 of `18092659.mp4`; crop `1680:760:160:150`, scale to width 1920 with Lanczos; WebP quality 76. |
| `sydney-plate-skyline.webp` | Frame at 00:03 of `3760621.mp4`; crop `1150:647:130:40`, scale to 1600×900 with Lanczos; WebP quality 76. |

The current V3 desktop poster and arteries plate were visually inspected during recovery: the poster shows the Harbour Bridge, Opera House and colourful water reflections; the plate shows urban light trails and the illuminated skyline. Visual subject matching alone does not establish source licensing. The processing records above, rather than resemblance to unrelated V2 imagery, establish the documented source association.

## Actual V3 output inventory

Measured directly from the current files using ffprobe, file size and SHA-256. Each video contains one video stream and **no audio stream**. Static WebP image duration is not applicable.

| File under `public/cinematic/` | Codec / dimensions | Duration | Bytes |
|---|---|---:|---:|
| `sydney-ruby-v3-desktop.mp4` | H.264 / 1600×900 / 24fps | 13.583333s | 2,032,271 |
| `sydney-ruby-v3-desktop.webm` | VP9 / 1600×900 / 24fps | 13.584000s | 1,689,270 |
| `sydney-ruby-v3-mobile.mp4` | H.264 / 540×960 / 24fps | 13.583333s | 1,068,219 |
| `sydney-ruby-v3-mobile.webm` | VP9 / 540×960 / 24fps | 13.584000s | 858,535 |
| `sydney-ruby-v3-poster.webp` | WebP / 1600×900 | — | 111,332 |
| `sydney-ruby-v3-mobile-poster.webp` | WebP / 540×960 | — | 38,496 |
| `sydney-plate-arteries.webp` | WebP / 864×1080 | — | 109,686 |
| `sydney-plate-harbour.webp` | WebP / 1920×868 | — | 149,070 |
| `sydney-plate-skyline.webp` | WebP / 1600×900 | — | 176,968 |

### SHA-256 output manifest

```text
4CF74A505003B8FFFDAC8A1E56D8E02F349B074E38E248F0425A6924FE31A2EA  sydney-ruby-v3-desktop.mp4
DEE5FAF55BFCAAAB8B759071A763537D40AFE7745C2CF77B4399AD199EAEE12B  sydney-ruby-v3-desktop.webm
7C3AB293FA0437371C3312371CC4B326205537510377BAD3936A5F2A4592B128  sydney-ruby-v3-mobile.mp4
A60A90D6C3485FFB8281EB7E3D217F7A7955CD40F92EA9F2EE378A559E0AD51F  sydney-ruby-v3-mobile.webm
BA7C080CDD1641C053F37EA1CB8B635960467F803D1ED9E170A211AC29D2FBB1  sydney-ruby-v3-poster.webp
7052A96EC241D280542135B6E822C23DD3E2A8DE617B9E1AF9198C064F244054  sydney-ruby-v3-mobile-poster.webp
C786F6387B5D8D2B8E27A8528EC277860F8AF7132010F362AA130C64B31EA4DB  sydney-plate-arteries.webp
3B89E8D4DDC347728910F84E6A3B8A1044D0CDE4799BC7185CEA503FBDB8036D  sydney-plate-harbour.webp
C895487D8685E4D0384338AB81F6FABF093B64E98B6CC5E46D3C90FF743BF47E  sydney-plate-skyline.webp
```

V3 retains versioned URLs rather than overwriting V2 immutable bytes. Preserve the original external V3 design and these output identities when performing future code recovery; provenance documentation does not authorize asset replacement.

---
## Historical V2 implementation (retained, not the mounted hero)

### V2 sources and production record

The prior V2 homepage used recorded Sydney footage from Pexels. The earlier AI harbour study is retained only as an unmounted V1 asset for history; it is not the source of the V2 hero or studio film. No paid generation, footage purchase or third-party account change was performed.

### Source ledger

Retrieved and inspected on 2026-11-15 (Australia/Sydney). Authors and original clip identities are preserved below; AB Web Studio does not claim to have shot this footage or imply contributor/landmark endorsement.

| Use | Creator / source | Original format | Observed download target |
|---|---|---|---|
| Desktop hero; studio film harbour chapters | Daniel Shepherd — [The Sydney Opera House and Harbour Bridge](https://www.pexels.com/video/the-sydney-opera-house-and-harbour-bridge-26580902/) | 3840×2160, 16.5165 seconds | `https://videos.pexels.com/video-files/26580902/11964223_3840_2160_30fps.mp4` |
| Dedicated mobile hero | David Pickup — [Sydney Harbor Bridge Nightscape with Illuminated City View](https://www.pexels.com/video/sydney-harbor-bridge-nightscape-with-illuminated-city-view-37264008/) | 2160×3840 portrait, 35.9333 seconds | `https://videos.pexels.com/video-files/37264008/15786275_2160_3840_30fps.mp4` |
| Studio film opening timelapse | Reel Focus Productions — [Timelapse Sydney](https://www.pexels.com/video/timelapse-sydney-27617055/) | 1920×1080 landscape | `https://videos.pexels.com/video-files/27617055/12186473_1920_1080_30fps.mp4` |

License basis: [Pexels License](https://www.pexels.com/license/) permits free commercial use and modification without mandatory attribution. [Pexels commercial-use guidance](https://help.pexels.com/hc/en-us/articles/360042295214-Can-I-use-the-photos-and-videos-for-a-commercial-project) notes that rights in depicted brands, people and artworks may still apply. No endorsement is represented. Preserve this ledger and recheck the applicable terms before using the material in another campaign or distribution context.

The clip-page Free download action exposed each CDN target; source files were then retrieved directly. The clip pages rejected ordinary terminal HTML retrieval, so no protected page or browser warning was bypassed. Source metadata and download links were obtained through the public page tooling. The original masters remain outside the repository, not bundled into the website.

## Hero derivatives

All delivered video has no audio. Restrained saturation/contrast correction retains real architecture rather than fabricating colour displays. There is no generative manipulation. Desktop is a twelve-second extract from the Daniel Shepherd clip; mobile is an eight-second extract from David Pickup's native portrait clip, not a landscape crop.

| File under `public/cinematic/` | Dimensions | Bytes |
|---|---:|---:|
| `sydney-ruby-v2-desktop.mp4` | 1600×900 | 1,355,334 |
| `sydney-ruby-v2-desktop.webm` | 1280×720 | 741,777 |
| `sydney-ruby-v2-mobile.mp4` | 480×854 | 709,233 |
| `sydney-ruby-v2-mobile.webm` | 480×854 | 483,991 |
| `sydney-ruby-v2-poster.webp` | 1600×900 | 56,344 |
| `sydney-ruby-v2-mobile-poster.webp` | 480×854 | 26,480 |

Both MP4 files use H.264 with fast-start metadata and 24fps. WebM uses VP9. The mobile encode is bitrate-limited rather than shipping the noisy multi-megabyte portrait master. Posters are art-directed native picture sources. Versioned V2 URLs do not overwrite cached V1 bytes.

`CinematicMedia` keeps its poster-first lifecycle: no video source before hydration, policy approval and viewport intersection; reduced motion, Save-Data and slow connections stay still unless the visitor explicitly chooses Play. Hidden/offscreen playback pauses. User pause is stable. Play-attempt identity guards stale promise rejection, interrupted playback can resume, genuine autoplay denial waits for a gesture, and terminal failure retains a still image. `onPlaying`, not `onPlay`, reveals decoded motion. Only one viewport encode and one codec are selected per mount.

## New original editorial studio film

**AB Web Studio — A different perspective** is a newly rendered 24-second silent editorial edit, not a relabelling of the old 3D video. It combines the licensed recorded footage above with actual existing project screenshots, typography and brief ruby-colour edit transitions. It contains no generated city footage, particle simulation, orbiting devices or 3D gallery.

Timeline:
- 00:00–00:04 — Reel Focus skyline timelapse; “A different perspective.”
- 00:04–00:08 — Daniel Shepherd's real Opera House / Harbour Bridge shot; “Presence.”
- 00:08–00:11 — actual Jufaja homepage screenshot.
- 00:11–00:14 — actual Milestone Renovate homepage screenshot.
- 00:14–00:17 — actual Aftab & Sons Transport homepage screenshot.
- 00:17–00:20 — actual 247 Inventory System screenshot, explicitly identified as custom business software.
- 00:20–00:24 — real harbour footage with AB Web Studio typography and its website address.

Files under `public/film/`: `ab-studio-ruby-v2-1080.mp4` (1920×1080, 3,325,264 bytes), `ab-studio-ruby-v2-720.mp4` (1280×720, 1,131,433 bytes), `ab-studio-ruby-v2-poster.webp` (43,616 bytes). FFprobe confirms 24.000000 seconds and a video-only stream. Individual opening/project/closing frames were visually inspected. `BrandFilmPlayer` still downloads film bytes only after a visitor gesture, preserving enquiry performance. The page's chapters and VideoObject schema describe this actual edit. No soundtrack or spoken information was added.

## Limitations and optional future production

This is a complete usable stock-footage-based web sequence and original studio edit, not a commissioned live-action shoot. A future commissioned aerial/architectural shoot or specifically cleared Vivid-festival material could add richer event lighting and more unique Sydney camera moves; those are not claimed as completed. The present footage shows authentic night illumination and a dusk timelapse, not fabricated festival displays.

## Archived V1 study

`public/cinematic/sydney-night-v1*` remains available but unmounted. It originated from Creative Claw job `65073f86-f290-4c64-a663-ebbdd192ad7f`, actual provider model `video/minimax-h3-max-turbo`, an eight-second free AI preview. It is not real recorded cinematography. `public/film/ab-web-studio-film-*` also remains unmounted; its previous 3D-led branding direction is not the V2 film. Retaining these bytes avoids unrelated deletion and preserves rollback options.
