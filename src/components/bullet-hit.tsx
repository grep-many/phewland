import { useFrame } from "@react-three/fiber";
import React from "react";
import * as THREE from "three";

type BulletHitProps = {
  position: THREE.Vector3;
  direction?: THREE.Vector3; // ✅ optional
};

export const BulletHit = ({ position, direction }: BulletHitProps) => {
  const meshRef = React.useRef<THREE.InstancedMesh>(null);
  const dummy = React.useMemo(() => new THREE.Object3D(), []);

  // ✅ SAFE forward vector
  const forward = React.useMemo(() => {
    if (direction && direction.lengthSq() > 0) {
      return direction.clone().normalize();
    }
    // fallback (never crashes)
    return new THREE.Vector3(0, 0, 1);
  }, [direction]);

  // perpendicular axes
  const right = React.useMemo(() => {
    const up = Math.abs(forward.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);

    return new THREE.Vector3().crossVectors(forward, up).normalize();
  }, [forward]);

  const up = React.useMemo(
    () => new THREE.Vector3().crossVectors(right, forward).normalize(),
    [right, forward],
  );

  // 3 perpendicular shards
  const shards = React.useRef([
    { dir: right.clone(), life: 1 },
    { dir: right.clone().negate(), life: 1 },
    { dir: up.clone(), life: 1 },
  ]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    shards.current.forEach((s, i) => {
      s.life = Math.max(s.life - delta * 4, 0);

      dummy.position.copy(position).addScaledVector(s.dir, (1 - s.life) * 0.35);

      dummy.scale.setScalar(0.04 * s.life);

      dummy.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), s.dir);

      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, 3]}>
      <boxGeometry args={[1.6, 0.2, 0.2]} />
      <meshStandardMaterial
        toneMapped={false}
        color={new THREE.Color("hotpink").multiplyScalar(8)}
      />
    </instancedMesh>
  );
};
