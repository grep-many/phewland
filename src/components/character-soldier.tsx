import { SoldierGLTF } from "@/assets";
import { useAnimations, useGLTF } from "@react-three/drei";
import { useGraph } from "@react-three/fiber";
import React from "react";
import { Color, LoopOnce, Mesh, MeshStandardMaterial, Object3D, SkinnedMesh, Group } from "three";
import { SkeletonUtils } from "three-stdlib";

const WEAPONS = [
  "GrenadeLauncher",
  "AK",
  "Knife_1",
  "Knife_2",
  "Pistol",
  "Revolver",
  "Revolver_Small",
  "RocketLauncher",
  "ShortCannon",
  "SMG",
  "Shotgun",
  "Shovel",
  "Sniper",
  "Sniper_2",
];

type Props = {
  color?: string;
  animation?: string;
  weapon?: string;
};

export function CharacterSoldier({
  color = "black",
  animation = "Idle",
  weapon = "AK",
  ...props
}: Props) {
  const group = React.useRef<Group | null>(null);

  const { scene, materials, animations } = useGLTF(SoldierGLTF);
  const clone = React.useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { nodes } = useGraph(clone);
  const { actions } = useAnimations(animations, group);

  React.useEffect(() => {
    const action = actions[animation];
    if (!action) return;

    action.reset().fadeIn(0.2).play();
    return () => {
      action.fadeOut(0.2);
    };
  }, [animation, actions]);

  React.useEffect(() => {
    const death = actions["Death"];
    if (death) {
      death.loop = LoopOnce;
      death.clampWhenFinished = true;
    }
  }, [actions]);

  const playerColorMaterial = React.useMemo(
    () =>
      new MeshStandardMaterial({
        color: new Color(color),
      }),
    [color],
  );

  React.useEffect(() => {
    // Hide non-selected weapons
    WEAPONS.forEach((wp) => {
      const obj = nodes[wp] as Object3D | undefined;
      if (obj) obj.visible = wp === weapon;
    });

    const applyMaterial = (root: Object3D) => {
      root.traverse((child) => {
        if ((child as Mesh).isMesh) {
          const mesh = child as Mesh;
          if (mesh.material && (mesh.material as any).name === "Character_Main") {
            mesh.material = playerColorMaterial;
          }
          mesh.castShadow = true;
          mesh.receiveShadow = true;
        }
      });
    };

    if (nodes.Body) applyMaterial(nodes.Body);
    if (nodes.Head) applyMaterial(nodes.Head);
    applyMaterial(clone);
  }, [nodes, clone, weapon, playerColorMaterial]);

  return (
    <group {...props} ref={group} dispose={null}>
      <group name="Scene">
        <group name="CharacterArmature">
          <primitive object={nodes.Root} />
          <group name="Body_1">
            <skinnedMesh
              geometry={(nodes.Cube004 as SkinnedMesh).geometry}
              material={materials.Skin}
              skeleton={(nodes.Cube004 as SkinnedMesh).skeleton}
              castShadow
            />
            <skinnedMesh
              geometry={(nodes.Cube004_1 as SkinnedMesh).geometry}
              material={materials.DarkGrey}
              skeleton={(nodes.Cube004_1 as SkinnedMesh).skeleton}
              castShadow
            />
            <skinnedMesh
              geometry={(nodes.Cube004_2 as SkinnedMesh).geometry}
              material={materials.Pants}
              skeleton={(nodes.Cube004_2 as SkinnedMesh).skeleton}
              castShadow
            />
            <skinnedMesh
              geometry={(nodes.Cube004_3 as SkinnedMesh).geometry}
              material={playerColorMaterial}
              skeleton={(nodes.Cube004_3 as SkinnedMesh).skeleton}
              castShadow
            />
            <skinnedMesh
              geometry={(nodes.Cube004_4 as SkinnedMesh).geometry}
              material={materials.Black}
              skeleton={(nodes.Cube004_4 as SkinnedMesh).skeleton}
              castShadow
            />
          </group>
        </group>
      </group>
    </group>
  );
}

useGLTF.preload(SoldierGLTF);
