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
import type { Vector3 } from "three";
import { BulletHit } from "./bullet-hit";

interface Player {
  state: PlayerState;
  joystick: Joystick;
}
export const Experience = () => {
  const [players, setPlayers] = React.useState<Player[]>([]);
  const [bullets, setBullets] = React.useState<TypeBullet[]>([]);
  const [networkBullets, setNetworkBullets] = useMultiplayerState<TypeBullet[]>("bullets", []);
  const [hits, setHits] = React.useState<TypeBulletHit[]>([]);
  const [networkHits, setNetworkHits] = useMultiplayerState<TypeBulletHit[]>("hits", []);

  const onFire = (newbullet: TypeBullet) => {
    setBullets(
      (bullets) =>
        bullets.some((bullet) => bullet.id === newbullet.id) ? bullets : [...bullets, newbullet], //bullets with same id should not be registered
    );
  };

  const onHit = (bulletId: string, position: Vector3) => {
    setBullets((bullets) => bullets.filter((bullet) => bullet.id !== bulletId));
    setHits((hits) => [...hits, { id: bulletId, position }]);
  };

  const onHitEnded = (hitId: TypeBulletHit["id"]) => {
    setHits((hits) => hits.filter((hit) => hit.id !== hitId));
  };

  const onKilled = (_victim: string, killer: string) => {
    const killerState = players.find((p) => p.state.id === killer);
    if (!killerState) return;
    killerState.state.setState("kills", killerState.state.getState("kills") + 1);
  };

  React.useEffect(() => {
    setNetworkBullets(bullets);
  }, [bullets]);

  React.useEffect(() => {
    setNetworkHits(hits);
  }, [hits]);

  React.useEffect(() => {
    (async () => await insertCoin())();

    onPlayerJoin((state) => {
      const joystick = new Joystick(state, {
        type: "angular",
        buttons: [{ id: "bullet", icon: FirePNG }],
      });

      const newPlayer = { state, joystick };
      state.setState("health", 100);
      state.setState("deaths", 0);
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
      {players.map(({ state, joystick }) => (
        <CharacterController
          key={state.id}
          state={state}
          joystick={joystick}
          userPlayer={state.id === myPlayer().id}
          onFire={onFire}
          onKilled={(killer) => onKilled(state.id, killer)}
        />
      ))}

      {(isHost() ? bullets : networkBullets).map((bullet) => (
        <Bullet key={bullet.id} {...bullet} onHit={(position) => onHit(bullet.id, position)} />
      ))}
      {(isHost() ? hits : networkHits).map((hit) => (
        <BulletHit key={hit.id} {...hit} onEnded={() => onHitEnded(hit.id)} />
      ))}
      <Environment preset="sunset" />
    </>
  );
};
