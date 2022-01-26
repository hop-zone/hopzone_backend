import { Platform } from "../../entities/gameobjects/Platform"


const amountOfPlaforms = 30

export const generateLevel = (): Platform[] => {
    const platforms: Platform[] = []
    let prevPlatform: Platform = new Platform(-50000, 200, 0)
    for (let i = 0; i < amountOfPlaforms; i++) {

        let platform = new Platform(getRandomInt(-1000, 1000), getRandomInt(-200, -1000), getRandomInt(0, 3))

        platforms.map((p) => {
            while (platform.intersects(p)) {
                platform = new Platform(getRandomInt(-1000, 1000), getRandomInt(-200, -1000), getRandomInt(0, 3))
            }
        })


        prevPlatform = platform
        platforms.push(platform)
    }

    return platforms
}


function getRandomInt(min: number, max: number): number {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}