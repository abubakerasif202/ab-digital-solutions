// Bump this when the bytes of a studio asset change. The public files keep
// stable names; only the URL segment is versioned, and Next rewrites it back.
export const STUDIO_ASSET_REV = "r2";

export const monogramUrl = `/studio/${STUDIO_ASSET_REV}/ab-monogram.glb`;
export const environmentUrl = `/studio/${STUDIO_ASSET_REV}/room-environment.bin`;

/** Overview uses the 512px frame. The gallery room asks for the detail frame. */
export function screenTextureUrl(slug: string, crisp: boolean) {
  return `/studio/${STUDIO_ASSET_REV}/screens/${slug}${crisp ? "@2x" : ""}.webp`;
}
