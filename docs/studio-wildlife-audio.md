# Studio wildlife and sound: asset sources and licences

## Audio

All Studio sound is **generated at play time with the Web Audio API** (`app/studio/audio/studio-audio.ts`).
There are no audio files, samples, recordings, songs, voices or downloaded assets, so nothing needs a licence or a download.

| Cue | How it is made |
| --- | --- |
| Welcome chime | Three sine bells (C5, E5, G5) with a quiet octave triangle overtone |
| Room transition | Two short rising sine tones |
| Selection feedback | One brief rising sine blip |
| Kangaroo hop | Low sine thump plus two springy triangle sweeps (comic "boi-oing") |
| Koala sleepy reaction | Slow falling filtered triangle sigh |
| Cockatoo chirp | Two quick band-passed sawtooth chirps, capped at 55% of master gain |

Wildlife audio assets still wanted if recorded sound is preferred later: a real kangaroo foot-thump, koala grunt/sigh and a sulphur-crested cockatoo call.
Any such file must be original, generated, or licensed (CC0 / commercial licence) and listed in this table before it is added.

Behaviour: on by default at a gentle volume (35%, hard master ceiling 0.5 gain through a limiter); the choice and volume persist in
`localStorage` (`ab-studio-sound-v1`); audio starts only when the browser allows it (first click or key press), and the UI never claims it is playing before then;
per-cue cooldowns and a no-overlap rule keep repeat taps quiet; audio suspends while the page is hidden and the context closes when leaving the Studio.

## 3D models

The kangaroo, koala, eucalyptus, cockatoo and railing are procedural Three.js geometry written for this project (shared unit spheres and cylinders). No external models or textures are used.
