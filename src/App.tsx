import { Canvas } from "@react-three/fiber";
import { Experience } from "./components/experience";
import { PCFSoftShadowMap } from "three";
import React from "react";
import { Physics } from "@react-three/rapier";

const App = () => (
  <Canvas
    shadows
    camera={{ position: [0, 30, 0], fov: 30 }}
    onCreated={(state) => {
      state.gl.shadowMap.enabled = true;
      state.gl.shadowMap.type = PCFSoftShadowMap; // 👈 THIS
    }}
  >
    <color attach="background" args={["#242424"]} />
    <React.Suspense>
      <Physics>
        <Experience />
      </Physics>
    </React.Suspense>
  </Canvas>
);

export default App;
