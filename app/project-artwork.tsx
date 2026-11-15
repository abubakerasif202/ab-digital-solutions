import Image from "next/image";
import type { CSSProperties } from "react";
import { artworkDimensions } from "./artwork-dimensions";
import type { Project } from "./project-data";

type Props = {
  project: Project;
  sizes: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
};

/** Intrinsic proportions of the supplied public desktop captures. */
export function projectArtworkRatio(project: Project): string {
  if (["wild-pest-solutions", "pept-up-labs"].includes(project.slug)) return "1440 / 1000";
  if (project.slug === "jufaja-homes") return "16 / 9";
  if (project.slug === "adelaide-wholesale-tyres") return "1440 / 986";
  if (["milestone-renovate", "on-call-trailers"].includes(project.slug)) return "1440 / 900";
  return "1348 / 926";
}

/**
 * Lets an image with real width/height attributes fill a sized, aspect-ratio wrapper,
 * so the browser reserves space from the attributes while the wrapper controls layout.
 */
export const fillFrame: CSSProperties = { position: "absolute", inset: 0, width: "100%", height: "100%" };

export function ProjectArtwork({ project, sizes, priority = false, onLoad, onError }: Props) {
  const { width, height } = artworkDimensions(projectArtworkRatio(project));
  return (
    <Image
      src={project.image}
      alt={project.alt}
      width={width}
      height={height}
      style={fillFrame}
      preload={priority}
      loading={priority ? undefined : "lazy"}
      sizes={sizes}
      onLoad={onLoad}
      onError={onError}
    />
  );
}
