import { Joystick, PlayerState } from "playroomkit";
declare global {
  interface Player {
    state: PlayerState;
    joyStick: Joystick;
  }
}