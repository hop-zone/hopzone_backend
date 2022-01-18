import { BaseEntity, Column, Entity, ObjectID, ObjectIdColumn } from "typeorm";
import { GameObject } from "./GameObject";


@Entity('PlayerObjects')
export class PlayerObject extends GameObject {



    @Column()
    uid?: string

    @Column()
    displayName?: string

    @Column()
    width?: number

    @Column()
    height?: number

    @Column()
    xSpeed?: number

    @Column()
    ySpeed?: number

    @Column()
    maxSpeed?: number

    @Column()
    movementSpeed?: number

    constructor(xPos: number, yPos: number, uid: string, displayName: string) {

        super(xPos, yPos)
        this.maxSpeed = 15
        this.movementSpeed = 10
        this.width = 50
        this.height = 50
        this.xSpeed = 0
        this.ySpeed = 0
        this.uid = uid
        this.displayName = displayName

    }
}