import { Game } from "../../entities/Game"
import { BoostedPlatform } from "../../entities/gameobjects/BoostedPlatform"
import { MovingPlatform } from "../../entities/gameobjects/MovingPlatform"
import { Platform } from "../../entities/gameobjects/Platform"
import { PlayerObject } from "../../entities/gameobjects/PlayerObject"

export const collide = (state: Game) => {
    const updatedState = state
    updatedState.players = updatedState.players.map((player) => {
        const updatedPlayer = new PlayerObject(player.x, player.y, player.uid, player.playerNum, player.displayName, player.highestPosition, player.isDead)
        updatedPlayer.ySpeed = player.ySpeed
        let collided = false
        let boostedCollision = false;
        state.platforms.map((platform) => {
            const platformObject = new Platform(platform.x, platform.y, platform.platformType)
            if (updatedPlayer.intersects(platformObject) && updatedPlayer.ySpeed > 0) {
                collided = true
            }
        })

        state.movingPlatforms.map((platform) => {
            const platformObject = new MovingPlatform(platform.x, platform.y)
            if (updatedPlayer.intersects(platformObject) && updatedPlayer.ySpeed > 0) {
                collided = true
            }
        })

        state.boostedPlatforms.map((platform) => {
            const platformObject = new BoostedPlatform(platform.x, platform.y)
            if (updatedPlayer.intersects(platformObject) && updatedPlayer.ySpeed > 0) {
                boostedCollision = true
            }
        })

        if (collided) {
            updatedPlayer.ySpeed = -updatedPlayer.maxSpeed
        }

        if (boostedCollision) {
            updatedPlayer.ySpeed = -25
        }

        return updatedPlayer
    })

    return updatedState
}