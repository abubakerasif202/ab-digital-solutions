import Image from "next/image";
import { ProjectArtwork, projectArtworkRatio } from "../project-artwork";
import type { Project } from "../project-data";

/* Desktop and phone captures of the same live site, composed as one piece:
   the desktop frame carries The Cut top-right, and the phone capture floats
   over its lower edge on a slower scroll layer (CSS view timeline, switched
   off for reduced motion). Both are real captures of the client's site. */
export function DeviceShowcase({ project }: { project: Project }) {
  if (!project.mobileImage) return null;
  return (
    <div className="gr-devices" data-reveal>
      <div className="gr-devices-desktop gr-cut-lg" style={{ aspectRatio: projectArtworkRatio(project) }}>
        <ProjectArtwork project={project} sizes="(max-width: 860px) 100vw, 1180px" />
      </div>
      <figure className="gr-devices-phone">
        <span className="gr-devices-phone-bar" aria-hidden="true"><i /></span>
        <Image
          src={project.mobileImage}
          alt={`${project.name} homepage at phone size`}
          width={780}
          height={1688}
          loading="lazy"
          sizes="(max-width: 640px) 46vw, (max-width: 1040px) 30vw, 300px"
        />
      </figure>
    </div>
  );
}
