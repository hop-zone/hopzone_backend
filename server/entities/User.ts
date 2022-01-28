import { BaseEntity, Column, Entity, ObjectID, ObjectIdColumn } from "typeorm";


@Entity('Users')
export class User extends BaseEntity {

    @ObjectIdColumn()
    _id?: ObjectID

    @Column()
    uid?: string

    @Column()
    displayName?: string

    @Column()
    highScore?: number

    @Column({ type: 'timestamp', nullable: true })
    highScoreDate?: Date
}