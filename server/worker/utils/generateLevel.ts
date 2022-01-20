import { Platform } from "../../entities/gameobjects/Platform"


const amountOfPlaforms = 50

export const generateLevel = (): Platform[] => {
    const platforms: Platform[] = []
    for (let i = 0; i < amountOfPlaforms; i++) {

        const platform = new Platform(getRandomInt(-1000, 1000), getRandomInt(0, -500), getRandomInt(0,3))
        platforms.push(platform)
    }

    return platforms
}


function getRandomInt(min: number, max: number): number {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}