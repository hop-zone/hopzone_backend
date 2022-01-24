import { Column } from "typeorm";
import { GameObject } from "./GameObject";

export class Enemy extends GameObject {
    @Column()
    width?: number = 100

    @Column()
    height?: number = 100

    @Column()
    originXpos: number;

    @Column()
    movingRange: number

    @Column()
    xSpeed: number

    constructor(xPos: number, yPos: number) {
        super(xPos, yPos)

        this.originXpos = xPos
        this.movingRange = 400
        this.xSpeed = 3
    }
}