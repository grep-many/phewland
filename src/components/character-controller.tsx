import React from "react";
import { type Group } from "three";
import { CharacterSoldier } from "./character-soldier";
import { isHost, type Joystick, type PlayerState } from "playroomkit";
import { CapsuleCollider, RapierRigidBody, RigidBody, vec3 } from "@react-three/rapier";
import { useFrame } from "@react-three/fiber";
import { CameraControls } from "@react-three/drei";

type Props = React.JSX.IntrinsicElements["group"] & {
  state: PlayerState;
  userPlayer: boolean;
  joystick: Joystick;
};

const MOVEMENT_SPEED = 200;

export const CharacterController = ({ state, userPlayer, joystick, ...props }: Props) => {
  const groupRef = React.useRef<Group | null>(null);
  const characterRef = React.useRef<Group | null>(null);
  const rigidBodyRef = React.useRef<RapierRigidBody | null>(null);
  const CameraControlsRef = React.useRef<CameraControls | null>(null);
  const [animation, setAnimation] = React.useState("Idle");

  useFrame((_, delta) => {
    if (!characterRef?.current || !rigidBodyRef?.current || !CameraControlsRef?.current) return;
    const cameraDistanceY = window.innerWidth < 1024 ? 16 : 20;
    const cameraDistanceZ = window.innerWidth < 1024 ? 12 : 16;
    const playerWorldPos = vec3(rigidBodyRef.current.translation());

    CameraControlsRef.current.setLookAt(
      playerWorldPos.x,
      playerWorldPos.y + state.getState("dead") ? 12 : cameraDistanceY,
      playerWorldPos.z + state.getState("dead") ? 12 : cameraDistanceZ,
      playerWorldPos.x,
      playerWorldPos.y + 1.5,
      playerWorldPos.z,
    );

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
      {userPlayer && <CameraControls ref={CameraControlsRef} />}
      <RigidBody
        ref={rigidBodyRef}
        colliders={false}
        linearDamping={12}
        lockRotations
        type={isHost() ? "dynamic" : "kinematicPosition"}
      >
        <group ref={characterRef}>
          <CharacterSoldier color={state.getState("profile")?.color} animation={animation} />
        </group>
        <CapsuleCollider args={[0.7, 0.6]} position={[0, 1.28, 0]} />
      </RigidBody>
    </group>
  );
};
