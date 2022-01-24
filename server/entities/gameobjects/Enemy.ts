import { Column } from "typeorm";
import { getRandomInt } from "../../worker/utils/getRandomInt";
import { GameObject } from "./GameObject";

export class Enemy extends GameObject {
    @Column()
    width?: number = 75

    @Column()
    height?: number = 254.25

    @Column()
    originXpos: number;

    @Column()
    ySpeed: number

    constructor(xPos: number, yPos: number) {
        super(xPos, yPos)

        this.originXpos = xPos
        this.ySpeed = getRandomInt(3, 7)
    }
}