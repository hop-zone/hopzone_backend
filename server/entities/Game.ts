import { BaseEntity, Column, Entity, ObjectID, ObjectIdColumn } from "typeorm";
import { Platform } from "./gameobjects/Platform";
import { PlayerObject } from "./gameobjects/PlayerObject";


@Entity('Games')
export class Game extends BaseEntity {
    @ObjectIdColumn()
    _id?: ObjectID

    @Column(type => PlayerObject)
    players: PlayerObject[]

    @Column()
    alivePlayers: number

    @Column()
    deadPlayers: number
    
    @Column()
    platforms: Platform[]

}