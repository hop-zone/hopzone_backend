import { Game } from "../../entities/Game"
import { BoostedPlatform } from "../../entities/gameobjects/BoostedPlatform"
import { Enemy } from "../../entities/gameobjects/Enemy"
import { MovingPlatform } from "../../entities/gameobjects/MovingPlatform"
import { Platform } from "../../entities/gameobjects/Platform"
import { PlayerObject } from "../../entities/gameobjects/PlayerObject"
import { kill } from "./playerMovement"

export const collide = (state: Game) => {
    const updatedState = state
    const playersToKill: PlayerObject[] = []
    updatedState.players = updatedState.players.map((player) => {
        const updatedPlayer = new PlayerObject(player.x, player.y, player.uid, player.playerNum, player.displayName, player.highestPosition, player.isDead, player.score)
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

        state.enemies.map((enemy) => {
            const EnemyObject = new Enemy(enemy.x, enemy.y)
            if (updatedPlayer.intersects(EnemyObject)) {
                playersToKill.push(updatedPlayer)
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

    if (playersToKill.length > 0) {
        updatedState.players = kill(updatedState, playersToKill).players
    }

    return updatedState
}