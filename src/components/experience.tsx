import { Environment, OrbitControls } from "@react-three/drei";
import { Map } from "./Map";
import React from "react";
import { insertCoin, Joystick, onPlayerJoin } from "playroomkit";
import { FirePNG } from "@/assets";

export const Experience = () => {
  const [players, setPlayers] = React.useState<Player[] | []>([]);
  React.useEffect(() => {
    (async () => await insertCoin())();
    onPlayerJoin((state) => {
      const joyStick = new Joystick(state, {
        type: "angular",
        buttons: [{ id: "phew", icon: FirePNG, label: "Phew!" }],
      });

      const newPlayer = { state, joyStick };
      state.setState("health", 100);
      state.setState("death", 0);
      state.setState("kills", 0);
      setPlayers((players) => [...players, newPlayer]);
      state.onQuit(() => setPlayers((players) => players.filter((p) => p.state.id !== state.id)));
    });
  }, []);

  return (
    <>
      <directionalLight
        position={[25, 18, -25]}
        intensity={0.3}
        castShadow
        shadow-camera-near={0}
        shadow-camera-far={80}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={25}
        shadow-camera-bottom={-25}
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-bias={-0.0001}
      />
      <OrbitControls />
      <Map />
      <Environment preset="sunset" />
    </>
  );
};
