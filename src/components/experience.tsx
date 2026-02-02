import { useEffect, useState } from "react";
import { Environment } from "@react-three/drei";
import { Map } from "./map";
import { CharacterController } from "./character-controller";
import { Bullet } from "./bullet";
import { BulletHit } from "./bullet-hit";
import { FirePNG } from "@/assets";

import {
  insertCoin,
  isHost,
  Joystick,
  myPlayer,
  onPlayerJoin,
  useMultiplayerState,
  type PlayerState,
} from "playroomkit";

import type { Vector3 } from "three";

interface Player {
  state: PlayerState;
  joystick: Joystick;
}

export const Experience = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [bullets, setBullets] = useState<TypeBullet[]>([]);
  const [hits, setHits] = useState<TypeBulletHit[]>([]);

  const [networkBullets, setNetworkBullets] = useMultiplayerState<TypeBullet[]>("bullets", []);
  const [networkHits, setNetworkHits] = useMultiplayerState<TypeBulletHit[]>("hits", []);

  /** FIRE BULLET */
  const onFire = (newBullet: TypeBullet) => {
    if (!isHost()) return;

    setBullets((prev) => (prev.some((b) => b.id === newBullet.id) ? prev : [...prev, newBullet]));

    // auto-expire safety
    setTimeout(() => {
      setBullets((prev) => prev.filter((b) => b.id !== newBullet.id));
    }, 2000);
  };

  /** BULLET HIT */
  const onHit = (bulletId: string, position: Vector3) => {
    if (!isHost()) return;

    // remove bullet
    setBullets((prev) => prev.filter((b) => b.id !== bulletId));

    const hitId = crypto.randomUUID();

    // spawn hit
    setHits((prev) => [...prev, { id: hitId, position }]);

    // deterministic cleanup
    setTimeout(() => {
      setHits((prev) => prev.filter((h) => h.id !== hitId));
    }, 500);
  };

  /** KILL HANDLER */
  const onKilled = (killerId: string) => {
    // if(killerId===victimId) return
    const killerState = players.find((p) => p.state.id === killerId)?.state;
    if (killerState) {
      const kills = killerState.getState("kills") || 0;
      killerState.setState("kills", kills + 1);
    }
  };

  /** NETWORK SYNC */
  useEffect(() => {
    if (isHost()) setNetworkBullets(bullets);
  }, [bullets]);

  useEffect(() => {
    if (isHost()) setNetworkHits(hits);
  }, [hits]);

  /** PLAYER JOIN LOGIC */
  useEffect(() => {
    (async () => await insertCoin())();

    onPlayerJoin((state) => {
      const joystick = new Joystick(state, {
        type: "angular",
        buttons: [{ id: "bullet", icon: FirePNG }],
        keyboard: true,
      });

      const newPlayer: Player = { state, joystick };
      state.setState("health", 100);
      state.setState("kills", 0);
      state.setState("deaths", 0);

      setPlayers((prev) =>
        prev.some((p) => p.state.id === state.id) ? prev : [...prev, newPlayer],
      );

      state.onQuit(() => {
        setPlayers((prev) => prev.filter((p) => p.state.id !== state.id));
      });
    });
  }, []);

  return (
    <>
      {/* LIGHTING */}
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

      {/* MAP */}
      <Map />

      {/* PLAYERS */}
      {players.map(({ state, joystick }, index) => (
        <CharacterController
          key={state.id}
          position-x={index * 1}
          state={state}
          joystick={joystick}
          userPlayer={state.id === myPlayer().id}
          onFire={onFire}
          onKilled={(killerId) => onKilled(killerId)}
        />
      ))}

      {/* BULLETS */}
      {(isHost() ? bullets : networkBullets).map((bullet) => (
        <Bullet key={bullet.id} {...bullet} onHit={(pos) => onHit(bullet.id, pos)} />
      ))}

      {/* BULLET HITS */}
      {(isHost() ? hits : networkHits).map((hit) => (
        <BulletHit key={`hit-${hit.id}`} {...hit} />
        // auto-expire handled by setTimeout
      ))}

      {/* ENVIRONMENT */}
      <Environment preset="sunset" />
    </>
  );
};
