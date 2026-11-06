import { useLoader } from "@react-three/fiber";
import type { Group } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

type StudioGLTF = { scene: Group };

/** GLTFLoader from three itself, so Draco, KTX2 and Meshopt stay out of the studio chunk. */
export function useStudioModel(url: string) {
  return useLoader(GLTFLoader, url) as StudioGLTF;
}

useStudioModel.preload = (url: string) => {
  useLoader.preload(GLTFLoader, url);
};

useStudioModel.clear = (url: string) => {
  useLoader.clear(GLTFLoader, url);
};
