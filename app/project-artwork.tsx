import Image from "next/image";
import type { Project } from "./project-data";

type Props = {
  project: Project;
  sizes: string;
  priority?: boolean;
};

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
