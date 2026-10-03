import {
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  type LucideIcon,
  type LucideProps,
} from "lucide-react";

/** One stroke weight and optical size for every icon on the site. */
export const iconProps = { size: 16, strokeWidth: 1.5, absoluteStrokeWidth: true } as const satisfies LucideProps;

const arrows = {
  "up-right": ArrowUpRight,
  "down-right": ArrowDownRight,
  right: ArrowRight,
  left: ArrowLeft,
  up: ArrowUp,
} as const satisfies Record<string, LucideIcon>;

export type ArrowDirection = keyof typeof arrows;

/**
 * Decorative arrow used by every CTA. It renders two copies of the glyph in a
 * clipped box so hover can send one out along its direction while the other
 * travels in behind it. A single classed span (no nested spans) keeps legacy
 * descendant selectors such as `.button span` from styling its internals.
 */
export function ArrowIcon({ direction = "up-right" }: { direction?: ArrowDirection }) {
  const Icon = arrows[direction];
  return (
    <span className={`icon-swap icon-swap-${direction}`} aria-hidden="true">
      <Icon {...iconProps} className="icon-swap-out" />
      <Icon {...iconProps} className="icon-swap-in" />
    </span>
  );
}

/** Static icon with the shared sizing; always decorative. */
export function Glyph({ icon: Icon, className, size = iconProps.size }: { icon: LucideIcon; className?: string; size?: number }) {
  return <Icon {...iconProps} size={size} className={className} aria-hidden="true" focusable="false" />;
}

/**
 * Reusable typographic signature: the AB monogram set as text with a ruby
 * slash. Decorative only; the real logo artwork stays in the header.
 */
export function StudioSignature({ className }: { className?: string }) {
  return (
    <span className={`ab-signature${className ? ` ${className}` : ""}`} aria-hidden="true">
      <b>AB</b>
      <i>/</i>
      <small>Web Studio</small>
    </span>
  );
}
