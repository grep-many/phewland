import { MapGLB } from "@/assets";
import { useGLTF } from "@react-three/drei";
import { RigidBody } from "@react-three/rapier";
import React from "react";
import * as THREE from "three";

export const Map = () => {
  const map = useGLTF(MapGLB);

  React.useEffect(() => {
    map.scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [map.scene]);

  return (
    <RigidBody colliders="trimesh" type="fixed">
      <primitive object={map.scene} />;
    </RigidBody>
  );
};

useGLTF.preload(MapGLB);
