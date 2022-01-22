import { Column, Entity } from "typeorm";
import { GameObject } from "./GameObject";


@Entity('Platforms')
export class BoostedPlatform extends GameObject {

    @Column()
    width: number = 120

    @Column()
    height: number = 30

    @Column()
    boostedSpeed: number = 25
}