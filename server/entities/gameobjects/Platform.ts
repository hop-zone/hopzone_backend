import { BaseEntity, Column, Entity } from "typeorm";
import { GameObject } from "./GameObject";


@Entity('Platforms')
export class Platform extends GameObject {

    @Column()
    width: number = 100

    @Column()
    height: number = 10
}