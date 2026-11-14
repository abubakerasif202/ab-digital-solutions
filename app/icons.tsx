import { ArrowDownRight, ArrowLeft, ArrowRight, ArrowUp, ArrowUpRight, type LucideIcon, type LucideProps } from "lucide-react";

/** One stroke weight and optical size for every icon on the site. */
export const iconProps = { size: 18, strokeWidth: 1.75, absoluteStrokeWidth: true } as const satisfies LucideProps;

const arrows = {
  "up-right": ArrowUpRight,
  "down-right": ArrowDownRight,
  right: ArrowRight,
  left: ArrowLeft,
  up: ArrowUp,
} as const satisfies Record<string, LucideIcon>;

export type ArrowDirection = keyof typeof arrows;

/** Decorative arrow used by every call to action. Hover movement is handled in CSS. */
export function ArrowIcon({ direction = "up-right" }: { direction?: ArrowDirection }) {
  const Icon = arrows[direction];
  return <Icon {...iconProps} aria-hidden="true" focusable="false" />;
}
