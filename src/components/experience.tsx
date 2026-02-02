import { Environment } from "@react-three/drei";
import { Map } from "./map";
import React from "react";
import {
  insertCoin,
  isHost,
  Joystick,
  myPlayer,
  onPlayerJoin,
  useMultiplayerState,
  type PlayerState,
} from "playroomkit";
import { FirePNG } from "@/assets";
import { CharacterController } from "./character-controller";
import { Bullet } from "./bullet";

interface Player {
  state: PlayerState;
  joystick: Joystick;
}
export const Experience = () => {
  const [players, setPlayers] = React.useState<Player[]>([]);
  const [bullets, setBullets] = React.useState<TypeBullet[]>([]);
  const [networkBullets, setNetworkBullets] = useMultiplayerState<TypeBullet[]>("bullet", []);

  const onFire = (newbullet: TypeBullet) => {
    setBullets(
      (bullets) =>
        bullets.some((bullet) => bullet.id === newbullet.id) ? bullets : [...bullets, newbullet], //bullets with same id should not be registered
    );
  };

  const onHit = (bulletId: string) => {
    setBullets((bullets) => bullets.filter((bullet) => bullet.id !== bulletId));
  };

  React.useEffect(() => {
    setNetworkBullets(bullets);
  }, [bullets]);

  React.useEffect(() => {
    (async () => await insertCoin())();

    onPlayerJoin((state) => {
      const joystick = new Joystick(state, {
        type: "angular",
        buttons: [{ id: "bullet", icon: FirePNG }],
      });

      const newPlayer = { state, joystick };
      state.setState("health", 100);
      state.setState("death", 0);
      state.setState("kills", 0);
      setPlayers((players) => {
        if (players.some((p) => p.state.id === state.id)) {
          return players; // already added
        }
        return [...players, newPlayer];
      });
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
        shadow-radius={6}
      />
      <Map />
      {players.map(({ state, joystick }, idx) => (
        <CharacterController
          key={state.id}
          position-x={idx * 2}
          state={state}
          joystick={joystick}
          userPlayer={state.id === myPlayer().id}
          onFire={onFire}
        />
      ))}

      {(isHost() ? bullets : networkBullets).map((bullet) => (
        <Bullet key={bullet.id} {...bullet} onHit={() => onHit(bullet.id)} />
      ))}
      <Environment preset="sunset" />
    </>
  );
};
