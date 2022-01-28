import { BaseEntity, Column, Entity } from "typeorm";
import { GameObject } from "./GameObject";


@Entity('Platforms')
export class Platform extends GameObject {

    @Column()
    width: number = 120

    @Column()
    height: number = 30

    @Column()
    platformType: number

    constructor(xPos: number, yPos: number, platformType: number){
        super(xPos, yPos)

        this.platformType = platformType
    }
}