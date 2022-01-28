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

    @Column()
    highestPosition?: number

    @Column()
    playerNum?: number

    @Column()
    isDead?: boolean

    @Column()
    score: number


    get deathBarrierYpos() {
        return this.highestPosition + 1000
    }

    constructor(xPos: number, yPos: number, uid: string, playerNum: number, displayName: string, highestPosition?: number, isDead?: boolean, score?: number) {

        super(xPos, yPos)
        this.maxSpeed = 15
        this.movementSpeed = 10
        this.width = 50
        this.height = 90
        this.xSpeed = 0
        this.ySpeed = 0
        this.highestPosition = highestPosition || 0
        this.uid = uid
        this.playerNum = playerNum
        this.displayName = displayName
        this.isDead = isDead || false
        this.score = score || 0

    }
}