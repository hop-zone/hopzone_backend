import { Column, Entity } from "typeorm";
import { GameObject } from "./GameObject";


@Entity('Platforms')
export class MovingPlatform extends GameObject {

    @Column()
    width: number = 120

    @Column()
    height: number = 30

    @Column()
    originXpos: number;

    @Column()
    movingRange: number

    @Column()
    xSpeed: number

    constructor(xPos: number, yPos: number) {
        super(xPos, yPos)

        this.originXpos = xPos
        this.movingRange = 200
        this.xSpeed = 3
    }

}