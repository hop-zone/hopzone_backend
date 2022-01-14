import { BaseEntity, Column, Entity, ObjectIdColumn } from "typeorm";


@Entity('Users')
export class User extends BaseEntity {

    @ObjectIdColumn()
    uid?: string

    @Column()
    displayName?: string
}