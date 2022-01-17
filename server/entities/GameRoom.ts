import { DecodedIdToken } from "firebase-admin/lib/auth/token-verifier";
import { BaseEntity, Column, CreateDateColumn, Entity, ObjectID, ObjectIdColumn } from "typeorm";
import { Game } from "./Game";
import { User } from "./User";



@Entity('GameRooms')
export class GameRoom extends BaseEntity {

    @ObjectIdColumn()
    roomId?: ObjectID

    @Column()
    game?: string

    @Column()
    hostId?: string

    @Column()
    hasStarted: boolean

    @Column(type => User)
    players?: User[]

    @CreateDateColumn({ type: 'timestamp', nullable: true })
    createdAt?: Date
}