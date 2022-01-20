import { BaseEntity, Column, ObjectIdColumn, PrimaryColumn } from "typeorm";
import { ObjectID } from 'mongodb'

interface Point {
    x: number,
    y: number
}

export class GameObject extends BaseEntity {

    @ObjectIdColumn()
    id?: string

    @Column()
    x?: number

    @Column()
    y?: number

    @Column()
    width?: number = 1

    @Column()
    height?: number = 1

    @Column()
    gravity?: number = 0.5

    @Column()
    color?: number

    get topLeft(): Point {
        const x = this.x - this.width / 2
        const y = this.y - this.height / 2

        return { x: x, y: y }
    }

    get bottomRight(): Point {
        const x = this.x + this.width / 2
        const y = this.y + this.height / 2

        return { x: x, y: y }
    }

    constructor(xPos: number, yPos: number) {

        super()
        this.x = xPos
        this.y = yPos

        this.color = Math.random() * 255
    }

    updatePosition(x: number, y: number) {
        this.x = x
        this.y = y
    }

    intersects(other: GameObject): boolean {

        //no horizontal overlap
        if (this.topLeft.x >= other.bottomRight.x || other.topLeft.x >= this.bottomRight.x) return false

        //no vertical overlap
        if (this.topLeft.y >= other.bottomRight.y || other.topLeft.y >= this.bottomRight.y) return false

        return true
    }
}