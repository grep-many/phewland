/// <reference types="vite/client" />

declare module "*.glb" {
  const src: string;
  export default src;
}

declare module "*.gltf" {
  const src: string;
  export default src;
}

interface ImportMetaEnv {
  readonly VITE_BASE_PATH: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
