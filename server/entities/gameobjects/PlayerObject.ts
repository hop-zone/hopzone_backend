import { BaseEntity, Column, Entity, ObjectID, ObjectIdColumn } from "typeorm";
import { GameObject } from "./GameObject";


@Entity('PlayerObjects')
export class PlayerObject extends GameObject {

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
}