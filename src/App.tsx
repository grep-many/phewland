import { Canvas } from "@react-three/fiber";
import { Experience } from "./components/experience";
import { PCFSoftShadowMap } from "three";
import React from "react";
import { Physics } from "@react-three/rapier";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { Leaderboard } from "./components/leader-board";
import { Loader } from "@react-three/drei";

const App = () => (
  <>
    <Loader/>
    <Leaderboard />
    <Canvas
      shadows
      camera={{ position: [0, 30, 0], fov: 30, near: 2 }}
      onCreated={(state) => {
        state.gl.shadowMap.enabled = true;
        state.gl.shadowMap.type = PCFSoftShadowMap;
      }}
    >
      <color attach="background" args={["#242424"]} />
      <React.Suspense>
        <Physics>
          <Experience />
        </Physics>
      </React.Suspense>
      <EffectComposer enableNormalPass={false}>
        <Bloom luminanceThreshold={1} intensity={1.5} minmapBlur />
      </EffectComposer>
    </Canvas>
  </>
);

export default App;
