import { RapierRigidBody, RigidBody } from "@react-three/rapier";
import React from "react";
import { MeshBasicMaterial } from "three";
import { WEAPON_OFFSET } from "./character-controller";
import { isHost } from "playroomkit";

type Props = TypeBullet & {
  onHit: (bulletId: TypeBullet["id"]) => void;
};

const BULLET_SPEED = 20;

const bulletMaterial = new MeshBasicMaterial({
  color: "hotpink",
  toneMapped: false,
});

bulletMaterial.color.multiplyScalar(42);

export const Bullet = ({ player, angle, position, onHit, id }: Props) => {
  const rigidBodyRef = React.useRef<RapierRigidBody>(null);

  React.useEffect(() => {
    if (!rigidBodyRef?.current) return;
    const velocity = {
      x: Math.sin(angle) * BULLET_SPEED,
      y: 0,
      z: Math.cos(angle) * BULLET_SPEED,
    };

    rigidBodyRef.current.setLinvel(velocity, true);
  }, []);

  return (
    <group position={[position.x, position.y, position.z]} rotation-y={angle}>
      <group position-x={WEAPON_OFFSET.x} position-y={WEAPON_OFFSET.y} position-z={WEAPON_OFFSET.z}>
        <RigidBody
          ref={rigidBodyRef}
          gravityScale={0}
          sensor
          onCollisionEnter={() => onHit(id)}
          onCollisionExit={() => onHit(id)}
          onIntersectionEnter={(e) => {
            if (isHost() && (e.other.rigidBody?.userData as RigidBodyUserData).type !== "bullet") {
              rigidBodyRef.current?.setEnabled(false);
              // onHit(vec3(rigidBodyRef.current?.translation()));
              onHit(id);
            }
          }}
          userData={{
            type: "bullet",
            player,
            damage: 10,
          }}
        >
          <mesh position-z={0.25} material={bulletMaterial} castShadow>
            <boxGeometry args={[0.05, 0.05, 0.5]} />
          </mesh>
        </RigidBody>
      </group>
    </group>
  );
};
