import { BaseEntity, Column, Entity, ObjectID, ObjectIdColumn } from "typeorm";


@Entity('Users')
export class User extends BaseEntity {

    @ObjectIdColumn()
    id?: ObjectID

    @Column()
    uid?: string

    @Column()
    displayName?: string
}