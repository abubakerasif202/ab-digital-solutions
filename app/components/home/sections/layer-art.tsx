import type { ReactNode } from "react";

/**
 * Line drawings printed on each exploded layer. Decorative only: they sit in an
 * aria-hidden stage, and the real copy lives in the list beside it.
 */
const frame = (children: ReactNode) => (
  <svg viewBox="0 0 320 200" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" focusable="false">
    {children}
  </svg>
);

const accent = "var(--signal)";

export const layerArt: readonly ReactNode[] = [
  // 01 website: a browser frame with hero, image slot and cards
  frame(
    <>
      <rect x="14" y="14" width="292" height="172" rx="4" />
      <path d="M14 38h292" />
      <circle cx="28" cy="26" r="3" />
      <circle cx="40" cy="26" r="3" />
      <circle cx="52" cy="26" r="3" />
      <path d="M32 62h112M32 76h84M32 90h96" />
      <rect x="32" y="108" width="52" height="16" rx="2" stroke={accent} />
      <rect x="176" y="54" width="112" height="72" rx="2" />
      <path d="M176 54l112 72M288 54l-112 72" opacity="0.45" />
      <rect x="32" y="142" width="76" height="30" rx="2" />
      <rect x="122" y="142" width="76" height="30" rx="2" />
      <rect x="212" y="142" width="76" height="30" rx="2" />
    </>,
  ),
  // 02 development: gutter plus indented code lines
  frame(
    <>
      <rect x="14" y="14" width="292" height="172" rx="4" />
      <path d="M54 14v172" opacity="0.5" />
      <path d="M26 38h16M26 56h16M26 74h16M26 92h16M26 110h16M26 128h16M26 146h16M26 164h16" opacity="0.5" />
      <path d="M70 38h96M82 56h120M82 74h72M70 92h40M82 110h132M94 128h88M82 146h60M70 164h24" />
      <path d="M170 74h46" stroke={accent} />
      <path d="M226 56l-10 10 10 10M262 56l10 10-10 10" opacity="0.6" />
    </>,
  ),
  // 03 business systems: a ledger table linked to a flow node
  frame(
    <>
      <rect x="14" y="14" width="196" height="172" rx="4" />
      <path d="M14 44h196M14 78h196M14 112h196M14 146h196M78 14v172M144 14v172" opacity="0.7" />
      <path d="M26 29h28M92 29h34M158 29h36" />
      <path d="M26 62h22M92 62h40M158 62h18M26 96h30M92 96h24M158 96h40M26 130h18M92 130h36M158 130h26M26 164h34M92 164h20M158 164h32" opacity="0.55" />
      <path d="M210 62h28l12-24h24M238 62l12 36h32M210 130h40l16 28h16" opacity="0.7" />
      <circle cx="274" cy="38" r="9" />
      <circle cx="290" cy="98" r="9" stroke={accent} />
      <circle cx="282" cy="158" r="9" />
    </>,
  ),
  // 04 AI and automation: a small node mesh with one live path
  frame(
    <>
      <rect x="14" y="14" width="292" height="172" rx="4" />
      <path d="M58 52L130 100M58 148L130 100M130 100L212 56M130 100L212 144M212 56L270 100M212 144L270 100M58 52L58 148M212 56L212 144" opacity="0.5" />
      <path d="M58 148L130 100L212 56L270 100" stroke={accent} strokeWidth="1.6" />
      <circle cx="58" cy="52" r="9" />
      <circle cx="58" cy="148" r="9" stroke={accent} />
      <circle cx="130" cy="100" r="11" stroke={accent} />
      <circle cx="212" cy="56" r="9" stroke={accent} />
      <circle cx="212" cy="144" r="9" />
      <circle cx="270" cy="100" r="9" stroke={accent} />
    </>,
  ),
];
