import Image from "next/image";
import type { Project } from "./project-data";

type Props = {
  project: Project;
  sizes: string;
  priority?: boolean;
};

/**
 * Renders a client project screenshot.
 *
 * The AB Web Studio watermark is baked into the image pixels by
 * `npm run watermark` rather than overlaid in the DOM, so it survives being
 * saved, hotlinked or reposted and cannot be removed from devtools. See
 * scripts/watermark-projects.mjs and tests/project-watermark.test.mjs.
 */
export function ProjectArtwork({ project, sizes, priority = false }: Props) {
  return (
    <Image
      src={project.image}
      alt={project.alt}
      fill
      priority={priority}
      loading={priority ? undefined : "lazy"}
      sizes={sizes}
    />
  );
}
