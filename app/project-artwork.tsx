import Image from "next/image";
import type { Project } from "./project-data";

type Props = {
  project: Project;
  sizes: string;
  priority?: boolean;
};

export function ProjectArtwork({ project, sizes, priority = false }: Props) {
  if (project.image) {
    return (
      <Image
        src={project.image}
        alt={project.alt}
        fill
        priority={priority}
        sizes={sizes}
      />
    );
  }

  return (
    <div className="project-cover" role="img" aria-label={project.alt}>
      <span>Live client project</span>
      <strong>{project.name}</strong>
      <small>Sydney · Brisbane · Melbourne · Adelaide</small>
      <i aria-hidden="true">1CE</i>
    </div>
  );
}
