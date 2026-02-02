import { SoldierGLTF } from "@/assets";
import { useAnimations, useGLTF } from "@react-three/drei";
import { useGraph } from "@react-three/fiber";
import React from "react";
import {
  Color,
  LoopOnce,
  Material,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  SkinnedMesh,
  Group,
  AnimationAction,
} from "three";
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
] as const;

type Props = Omit<GroupProps, "color"> & {
  color: string;
  animation?: string;
  weapon?: string;
};

export function CharacterSoldier({
  color = "black",
  animation = "Idle",
  weapon = "AK",
  ...props
}: Props) {
  const group = React.useRef<Group>(null);

  const { scene, materials, animations } = useGLTF(SoldierGLTF);
  const clone = React.useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { nodes } = useGraph(clone);

  const { mixer } = useAnimations(animations, group);

  /**
   * Play animation using our own AnimationAction
   * (never mutates hook-returned values)
   */
  React.useEffect(() => {
    if (!mixer || !group.current) return;

    const root = group.current; // 👈 snapshot ref
    const clip = animations.find((a) => a.name === animation);
    if (!clip) return;

    const action: AnimationAction = mixer.clipAction(clip, root);

    if (animation === "Death") {
      action.setLoop(LoopOnce, 1);
      action.clampWhenFinished = true;
    }

    action.reset().fadeIn(0.2).play();

    return () => {
      action.fadeOut(0.2);
      action.stop();
      mixer.uncacheAction(clip, root); // 👈 stable ref
    };
  }, [animation, animations, mixer]);

  /**
   * Player color material
   */
  const playerColorMaterial = React.useMemo(
    () =>
      new MeshStandardMaterial({
        color: new Color(color),
      }),
    [color],
  );

  /**
   * Weapon visibility + material overrides
   */
  React.useEffect(() => {
    WEAPONS.forEach((wp) => {
      const obj = nodes[wp] as Object3D | undefined;
      if (obj) obj.visible = wp === weapon;
    });

    const applyMaterial = (root: Object3D) => {
      root.traverse((child) => {
        if (!(child instanceof Mesh)) return;

        const material = child.material as Material | Material[];
        const mats = Array.isArray(material) ? material : [material];

        mats.forEach((mat) => {
          if (mat.name === "Character_Main") {
            child.material = playerColorMaterial;
          }
        });

        child.castShadow = true;
        child.receiveShadow = true;
      });
    };

    if (nodes.Body) applyMaterial(nodes.Body);
    if (nodes.Head) applyMaterial(nodes.Head);
    applyMaterial(clone);
  }, [nodes, clone, weapon, playerColorMaterial]);

  return (
    <group ref={group} {...props} dispose={null}>
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
