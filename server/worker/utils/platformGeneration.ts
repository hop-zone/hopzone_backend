import { Game } from "../../entities/Game"
import { BoostedPlatform } from "../../entities/gameobjects/BoostedPlatform"
import { MovingPlatform } from "../../entities/gameobjects/MovingPlatform"
import { Platform } from "../../entities/gameobjects/Platform"
import { getRandomInt } from "./getRandomInt"

export const generatePlatforms = (oldState: Game) => {
    const state = oldState

    const highestPlayer = Math.min.apply(
        Math,
        state.players.map(function (o) {
            return o.y
        }),
    )
    const highestPlatform = Math.min.apply(
        Math,
        state.platforms.map(function (o) {
            return o.y
        }),
    )

    const lowestPlayer = Math.max.apply(
        Math,
        state.players.map(function (o) {
            return o.y
        }),
    )
    const lowestPlatform = Math.max.apply(
        Math,
        state.platforms.map(function (o) {
            return o.y
        }),
    )

    let copyOfPlatforms = [...state.platforms]


    if (highestPlayer < highestPlatform + 200) {
        let highestPlatformObject = copyOfPlatforms.find((p) => { return p.y == highestPlatform })
        const newPlatform: Platform = new Platform(
            getRandomInt(highestPlatformObject.x - 500, highestPlatformObject.x + 300),
            getRandomInt(highestPlatform, highestPlatform - 300),
            getRandomInt(0, 3)
        )
        copyOfPlatforms.push(newPlatform)
        for (let i = 0; i < 4; i++) {
            const newPlatform: Platform = new Platform(
                getRandomInt(-1000, 1000),
                getRandomInt(highestPlatform, highestPlatform - 300),
                getRandomInt(0, 3)
            )
            if (newPlatform.x < -1000) newPlatform.x = getRandomInt(-1000, -500)
            if (newPlatform.x > 1000) newPlatform.x = getRandomInt(500, 1000)
            copyOfPlatforms.push(newPlatform)
        }
    }




    if (lowestPlayer < lowestPlatform - 1000) {
        copyOfPlatforms = copyOfPlatforms.filter((p: Platform) => {
            return p.y != lowestPlatform
        })
    }




    state.platforms = copyOfPlatforms



    return state
}

export const generateMovingPlatforms = (state: Game) => {
    const highestPlayer = Math.min.apply(
        Math,
        state.players.map(function (o) {
            return o.y
        }),
    )

    const lowestPlayer = Math.max.apply(
        Math,
        state.players.map(function (o) {
            return o.y
        }),
    )

    const highestMovingPlatform = Math.min.apply(
        Math,
        state.movingPlatforms.map(function (o) {
            return o.y
        }),
    )


    const lowestMovingPlatform = Math.max.apply(
        Math,
        state.movingPlatforms.map(function (o) {
            return o.y
        }),
    )

    let copyOfMovingPlatforms = [...state.movingPlatforms]


    if (highestPlayer < highestMovingPlatform + 100) {
        const newPlatform: MovingPlatform = new MovingPlatform(getRandomInt(-1000, 1000), getRandomInt(highestMovingPlatform, highestMovingPlatform - 2000),)
        copyOfMovingPlatforms.push(newPlatform)
    }

    if (lowestPlayer < lowestMovingPlatform - 1000) {
        copyOfMovingPlatforms = copyOfMovingPlatforms.filter((p: MovingPlatform) => {
            return p.y != lowestMovingPlatform
        })
    }

    state.movingPlatforms = copyOfMovingPlatforms

    return state
}

export const generateBoostedPlatforms = (state: Game) => {
    const highestPlayer = Math.min.apply(
        Math,
        state.players.map(function (o) {
            return o.y
        }),
    )

    const lowestPlayer = Math.max.apply(
        Math,
        state.players.map(function (o) {
            return o.y
        }),
    )

    const highestBoostedPlatform = Math.min.apply(
        Math,
        state.boostedPlatforms.map(function (o) {
            return o.y
        }),
    )

    const lowestBoostedPlatform = Math.max.apply(
        Math,
        state.boostedPlatforms.map(function (o) {
            return o.y
        }),
    )

    let copyOfBoostedPlatforms = [...state.boostedPlatforms]

    if (highestPlayer < highestBoostedPlatform + 100) {
        const newPlatform: BoostedPlatform = new BoostedPlatform(getRandomInt(-1000, 1000), getRandomInt(highestBoostedPlatform, highestBoostedPlatform - 2000),)
        copyOfBoostedPlatforms.push(newPlatform)
    }

    if (lowestPlayer < lowestBoostedPlatform - 1000) {
        copyOfBoostedPlatforms = copyOfBoostedPlatforms.filter((p: BoostedPlatform) => {
            return p.y != lowestBoostedPlatform
        })
    }

    state.boostedPlatforms = copyOfBoostedPlatforms

    return state
}