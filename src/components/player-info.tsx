import { Billboard, Text } from "@react-three/drei";
import { myPlayer, type PlayerState } from "playroomkit";

type Props = {
  player: PlayerState;
};

export const PlayerInfo = ({ player }: Props) => {
  const health = player.getState("health");
  const name =
    myPlayer().getProfile().name === player.getProfile().name
      ? "You"
      : player.getState("profile").name;

  return (
    <Billboard position-y={2.5}>
      <Text position-y={0.36} fontSize={0.4}>
        {name}
        <meshBasicMaterial color={player.getState("profile").color} />
      </Text>
      <mesh position-z={-0.1}>
        <planeGeometry args={[1, 0.2]} />
        <meshBasicMaterial color="black" transparent opacity={0.5} />
      </mesh>
      <mesh scale-x={health / 100} position-x={-0.5 * (1 - health / 100)}>
        <planeGeometry args={[1, 0.2]} />
        <meshBasicMaterial color="red" />
      </mesh>
    </Billboard>
  );
};
