interface Point {
    x: number,
    y: number
}

export class GameObject {
    id: number
    x: number
    y: number
    width: number = 1
    height: number = 1

    gravity: number = 0.4

    color: number

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
        this.x = xPos
        this.y = yPos
        this.id = Math.floor(Math.random() * 10000)

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