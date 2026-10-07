import Image from "next/image";
import type { Project } from "./project-data";

type Props = {
  project: Project;
  sizes: string;
  priority?: boolean;
};

/** Intrinsic proportions of the supplied public desktop captures. */
export function projectArtworkRatio(project: Project): string {
  if (project.slug === "jufaja-homes") return "16 / 9";
  if (project.slug === "adelaide-wholesale-tyres") return "1440 / 986";
  return "1348 / 926";
}

export function ProjectArtwork({ project, sizes, priority = false }: Props) {
  return (
    <Image
      src={project.image}
      alt={project.alt}
      fill
      preload={priority}
      loading={priority ? undefined : "lazy"}
      sizes={sizes}
    />
  );
}
