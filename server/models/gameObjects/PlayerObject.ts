import { GameObject } from "./GameObject"

export class PlayerObject extends GameObject {

    width: number = 50
    height: number = 50
    xSpeed: number = 0
    ySpeed: number = 0
    maxSpeed: number = 15
    movementSpeed: number = 10
}