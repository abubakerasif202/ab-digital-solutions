"use client";

import { CockatooFeature } from "./Cockatoo";
import { KoalaFeature } from "./Koala";
import { ResidentKangaroo } from "./ResidentKangaroo";

/** The three resident animals. The visiting red kangaroo (`../Kangaroo`) is retired in favour of this greeter. */
export function Wildlife() {
  return <>
    <ResidentKangaroo />
    <KoalaFeature />
    <CockatooFeature />
  </>;
}
