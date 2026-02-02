import React from "react";
import { type Group } from "three";
import { CharacterSoldier } from "./character-soldier";
import { isHost, type Joystick, type PlayerState } from "playroomkit";
import { CapsuleCollider, RapierRigidBody, RigidBody, vec3 } from "@react-three/rapier";
import { useFrame, useThree } from "@react-three/fiber";
import { CameraControls } from "@react-three/drei";
import { Crosshair } from "./crosshair";
import { PlayerInfo } from "./player-info";
import { useKeyboard } from "@/hooks";

type Props = React.JSX.IntrinsicElements["group"] & {
  state: PlayerState;
  userPlayer: boolean;
  joystick: Joystick;
  onFire: (newBullet: TypeBullet) => void;
  onKilled: (id: string, userData: RigidBodyUserData["player"]) => void;
};

const MOVEMENT_SPEED = 200;
const FIRE_RATE = 380;

export const WEAPON_OFFSET = {
  x: -0.2,
  y: 1.4,
  z: 1.4,
};

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
  const rigidBodyRef = React.useRef<RapierRigidBody>(null);
  const cameraControlsRef = React.useRef<CameraControls>(null);
  const lastShootRef = React.useRef<number>(0);
  const keyboard = useKeyboard();

  const [animation, setAnimation] = React.useState("Idle");

  const scene = useThree((state) => state.scene);
  const spawnRandomly = () => {
    if (!rigidBodyRef?.current) return;
    const spawns = [];

    for (let i = 0; i < 1000; i++) {
      const spawn = scene.getObjectByName(`spawn_${i}`);
      if (spawn) {
        spawns.push(spawn);
      } else {
        break;
      }
    }

    const spawnPos = spawns[Math.floor(Math.random() * spawns.length)].position;
    rigidBodyRef.current.setTranslation(spawnPos, true);
  };

  React.useEffect(() => {
    spawnRandomly();
  }, []);

  useFrame((_, delta) => {
    if (!rigidBodyRef?.current || !characterRef?.current || !cameraControlsRef?.current) return;
    const cameraDistanceY = window.innerWidth < 1024 ? 16 : 20;
    const cameraDistanceZ = window.innerWidth < 1024 ? 12 : 16;
    const playerWorldPos = vec3(rigidBodyRef.current.translation());

    cameraControlsRef.current.setLookAt(
      playerWorldPos.x,
      playerWorldPos.y + state.getState("dead") ? 12 : cameraDistanceY,
      playerWorldPos.z + state.getState("dead") ? 12 : cameraDistanceZ,
      playerWorldPos.x,
      playerWorldPos.y + 1.5,
      playerWorldPos.z,
      true,
    );

    if (state.getState("dead")) return setAnimation("Death");

    const angle = joystick.angle();
    if (joystick.isJoystickPressed() && angle) {
      setAnimation("Run");
      characterRef.current.rotation.y = angle;

      const impulse = {
        x: Math.sin(angle) * MOVEMENT_SPEED * delta,
        y: 0,
        z: Math.cos(angle) * MOVEMENT_SPEED * delta,
      };

      rigidBodyRef.current.applyImpulse(impulse, true);
    } else {
      setAnimation("Idle");
    }

    if (joystick.isPressed("bullet") || keyboard.shoot) {
      if (joystick.angle() && joystick.isJoystickPressed()) {
        setAnimation("Run_Shoot");
      } else {
        setAnimation("Idle_Shoot");
      }
      if (isHost()) {
        if (Date.now() - lastShootRef.current > FIRE_RATE) {
          lastShootRef.current = +new Date(); //+unary operator converts date into number
          const newBullet = {
            id: state.id + "-" + lastShootRef.current,
            position: vec3(rigidBodyRef.current.translation()),
            angle,
            player: state.id,
          };
          onFire(newBullet);
        }
      }
    }

    if (isHost()) {
      state.setState("pos", rigidBodyRef.current.translation());
    } else {
      const pos = state.getState("pos");
      if (pos) {
        rigidBodyRef.current.setTranslation(pos, true);
      }
    }
  });

  return (
    <group ref={groupRef} {...props}>
      {userPlayer && <CameraControls ref={cameraControlsRef} />}
      <RigidBody
        ref={rigidBodyRef}
        colliders={false}
        linearDamping={12}
        lockRotations
        type={isHost() ? "dynamic" : "kinematicPosition"}
        onIntersectionEnter={({ other }) => {
          const userData = other.rigidBody?.userData as RigidBodyUserData;
          if (isHost() && userData.type === "bullet" && state.getState("health") > 0) {
            const newHealth = state.getState("health") - userData.damage;
            if (newHealth > 0) return state.setState("health", newHealth);
            state.setState("deaths", state.getState("deaths") + 1);
            state.setState("dead", true);
            state.setState("health", 0);
            rigidBodyRef.current?.setEnabled(false);
            setTimeout(() => {
              spawnRandomly();
              rigidBodyRef.current?.setEnabled(true);
              state.setState("health", 100);
              state.setState("dead", false);
            }, 2000);
            onKilled(state.id, userData.player);
          }
        }}
      >
        <PlayerInfo player={state} />
        <group ref={characterRef}>
          <CharacterSoldier color={state.getState("profile").color}  animation={animation} />
          {userPlayer && (
            <Crosshair position={[WEAPON_OFFSET.x, WEAPON_OFFSET.y, WEAPON_OFFSET.z]} />
          )}
        </group>
        <CapsuleCollider args={[0.7, 0.6]} position={[0, 1.28, 0]} />
      </RigidBody>
    </group>
  );
};
