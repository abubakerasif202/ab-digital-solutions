import Image from "next/image";
import type { Project } from "./project-data";
import { assetBase } from "./site-config";
import "./project-artwork.css";

type Props = {
  project: Project;
  sizes: string;
  priority?: boolean;
};

export function ProjectArtwork({ project, sizes, priority = false }: Props) {
  return (
    <div className="project-artwork">
      <Image
        src={project.image}
        alt={project.alt}
        fill
        priority={priority}
        loading={priority ? undefined : "lazy"}
        sizes={sizes}
      />
      <span className="project-artwork-watermark" aria-hidden="true">
        <Image
          className="project-artwork-watermark-logo"
          src={`${assetBase}/ab-logo-mark.png`}
          alt=""
          width={400}
          height={340}
          sizes="28px"
        />
        <span>
          <strong>AB Web Studio</strong>
          <small>abwebstudio.com.au</small>
        </span>
      </span>
    </div>
  );
}
