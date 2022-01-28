import { DecodedIdToken } from "firebase-admin/lib/auth/token-verifier";
import { BaseEntity, Column, CreateDateColumn, Entity, ObjectID, ObjectIdColumn, UpdateDateColumn } from "typeorm";
import { Game } from "./Game";
import { User } from "./User";



@Entity('GameRooms')
export class GameRoom extends BaseEntity {


    @ObjectIdColumn()
    roomId?: ObjectID

    @Column(type => Game)
    game?: Game

    @Column()
    hostId?: string

    @Column()
    hasStarted: boolean

    @Column()
    hasEnded: boolean

    @Column(type => User)
    players?: User[]

    @Column(type => User)
    alivePlayers?: User[]

    @Column(type => User)
    deadPlayers?: User[]

    @CreateDateColumn({ type: 'timestamp', nullable: true })
    createdAt?: Date

    @UpdateDateColumn({ type: 'timestamp', nullable: true })
    updatedAt?: Date
}