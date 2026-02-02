import React from "react";
import { Group, Vector3 } from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { CameraControls } from "@react-three/drei";
import { CapsuleCollider, RapierRigidBody, RigidBody, vec3 } from "@react-three/rapier";
import { isHost, Joystick, type PlayerState } from "playroomkit";

import { CharacterSoldier } from "./character-soldier";
import { Crosshair } from "./crosshair";
import { PlayerInfo } from "./player-info";
import { useKeyboard } from "@/hooks";

type Props = React.JSX.IntrinsicElements["group"] & {
  state: PlayerState;
  userPlayer: boolean;
  joystick: Joystick;
  onFire: (bullet: TypeBullet) => void;
  onKilled: (killer: string) => void;
};

const MOVE_SPEED = 6;
const TURN_SPEED = 12;
const FIRE_RATE = 380;

export const WEAPON_OFFSET = { x: -0.2, y: 1.4, z: 0.8 };

export const CharacterController = ({
  state,
  userPlayer,
  joystick,
  onFire,
  onKilled,
  ...props
}: Props) => {
  const groupRef = React.useRef<Group>(null);
  const characterRef = React.useRef<Group>(null);
  const bodyRef = React.useRef<RapierRigidBody>(null);
  const cameraRef = React.useRef<CameraControls>(null);

  const keyboard = useKeyboard();
  const scene = useThree((s) => s.scene);

  const lastShoot = React.useRef(0);
  const moveDir = React.useRef(new Vector3());
  const [animation, setAnimation] = React.useState("Idle");

  /* ---------------- Spawn ---------------- */
  const spawnPoints = React.useMemo(() => {
    const points = [];
    for (let i = 0; i < 1000; i++) {
      const s = scene.getObjectByName(`spawn_${i}`);
      if (!s) break;
      points.push(s);
    }
    return points;
  }, [scene]);

  const spawn = React.useCallback(() => {
    if (!bodyRef.current || !spawnPoints.length) return;
    const s = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
    bodyRef.current.setTranslation(s.position, true);
  }, [spawnPoints]);

  React.useEffect(() => {
    if (isHost()) spawn();
  }, [spawn]);

  /* ---------------- Frame ---------------- */
  useFrame((_, delta) => {
    const body = bodyRef.current;
    const character = characterRef.current;
    if (!body || !character) return;

    const dead = state.getState("dead");
    const angle = joystick.angle();

    // Compute once
    const moving = joystick.isJoystickPressed() && angle !== null;
    const shooting = joystick.isPressed("bullet") || (userPlayer && keyboard.shoot);

    /* ---------- Camera (local player) ---------- */
    if (userPlayer && cameraRef.current) {
      const p = vec3(body.translation());
      cameraRef.current.setLookAt(
        p.x,
        p.y + (dead ? 12 : 18),
        p.z + (dead ? 10 : 14),
        p.x,
        p.y + 1.5,
        p.z,
        true,
      );
    }

    if (dead) {
      setAnimation("Death");
      return;
    }

    /* ---------- HOST movement and firing ---------- */
    if (isHost()) {
      // Movement
      if (moving) {
        character.rotation.y += (angle! - character.rotation.y) * TURN_SPEED * delta;
        moveDir.current.set(Math.sin(character.rotation.y), 0, Math.cos(character.rotation.y));
        body.setLinvel(
          { x: moveDir.current.x * MOVE_SPEED, y: 0, z: moveDir.current.z * MOVE_SPEED },
          true,
        );
        state.setState("angle", character.rotation.y);
      } else {
        const v = body.linvel();
        body.setLinvel({ x: v.x * 0.85, y: 0, z: v.z * 0.85 }, true);
      }

      state.setState("pos", body.translation());

      // Shooting
      if (shooting) {
        const now = Date.now();
        if (now - lastShoot.current > FIRE_RATE) {
          lastShoot.current = now;
          onFire({
            id: `${state.id}-${now}`,
            position: vec3(body.translation()),
            angle: character.rotation.y,
            player: state.id,
          });
        }
      }
    } else {
      /* ---------- CLIENT prediction ---------- */
      const pos = state.getState("pos");
      const a = state.getState("angle");
      if (pos) body.setNextKinematicTranslation(pos);
      if (a !== null) character.rotation.y = a;
    }

    /* ---------- Animation ---------- */
    let next = "Idle";
    if (shooting) next = moving ? "Run_Shoot" : "Idle_Shoot";
    else if (moving) next = "Run";
    setAnimation((a) => (a === next ? a : next));
  });

  /* ---------------- JSX ---------------- */
  return (
    <group ref={groupRef} {...props}>
      {userPlayer && <CameraControls ref={cameraRef} />}

      <RigidBody
        ref={bodyRef}
        colliders={false}
        linearDamping={2}
        lockRotations
        type={isHost() ? "dynamic" : "kinematicPosition"}
      >
        <PlayerInfo player={state} />

        <group ref={characterRef}>
          <CharacterSoldier color={state.getState("profile").color} animation={animation} />
          {userPlayer && (
            <Crosshair position={[WEAPON_OFFSET.x, WEAPON_OFFSET.y, WEAPON_OFFSET.z]} />
          )}
        </group>

        <CapsuleCollider
          onCollisionEnter={({ other }) => {
            const data = other.rigidBody?.userData as RigidBodyUserData;
            if (!isHost() || data?.type !== "bullet") return;

            const hp = state.getState("health");
            if (hp <= 0) return;

            const nextHp = hp - data.damage;
            if (nextHp > 0) {
              state.setState("health", nextHp);
              return;
            }

            state.setState("dead", true);
            state.setState("health", 0);
            state.setState("deaths", state.getState("deaths") + 1);
            bodyRef.current?.setEnabled(false);

            setTimeout(() => {
              spawn();
              bodyRef.current?.setEnabled(true);
              state.setState("health", 100);
              state.setState("dead", false);
            }, 2000);

            onKilled(data.player);
          }}
          args={[0.7, 0.6]}
          position={[0, 1.28, 0]}
        />
      </RigidBody>
    </group>
  );
};
