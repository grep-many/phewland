import type React from "react";
import { Vector3 } from "three";

declare global {
  type TypeBullet = {
    id: string;
    position: Vector3;
    angle: number;
    player: string;
  };

  type RigidBodyUserData = {
    type: "bullet" | "player" | "environment";
    player: string;
    damage: number;
  };

  type TypeBulletHit = {
    id: TypeBullet["id"];
    position: TypeBullet["position"];
  };

  type GroupProps = React.JSX.IntrinsicElements["group"];
  
}
