import { Canvas } from "@react-three/fiber";
import { Experience } from "./components/experience";
import { SoftShadows } from "@react-three/drei";

const App = () => (
  <Canvas shadows camera={{ position: [0, 30, 0], fov: 30 }}>
    <color attach="background" args={["#242424"]} />
    <SoftShadows />

    <Experience />
  </Canvas>
);

export default App;
