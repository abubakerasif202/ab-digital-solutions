"use client";

import { useEffect } from "react";
import { startPointerFX } from "./pointer-fx";

/** Fine-pointer artwork tilt and icon magnetism keep control hit areas fixed. */
export function PointerFX() {
  useEffect(() => startPointerFX(), []);
  return null;
}
