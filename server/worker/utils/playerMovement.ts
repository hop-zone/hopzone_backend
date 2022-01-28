import { Game } from "../../entities/Game"
import { PlayerObject } from "../../entities/gameobjects/PlayerObject"
import { EPlayerMovements } from "../../interfaces/workerMessage"

export const kill = (state: Game, players: PlayerObject[]) => {
    const updatedState = state

    players.map((p) => {
        const i = state.players.indexOf(p)
        updatedState.players[i].isDead = true
    })

    let deadCount = 0
    let aliveCount = 0

    updatedState.players.map((p) => {
        if (p.isDead) {
            deadCount++
        } else {
            aliveCount++
        }
    })

    updatedState.deadPlayers = deadCount
    updatedState.alivePlayers = aliveCount

    return updatedState
}

export const gravity = (state: Game) => {
    const updatedState = state
    const playersToKill: PlayerObject[] = []
    updatedState.players = updatedState.players.map((p, i) => {
        if (!p.isDead) {
            p.y += p.ySpeed
            p.ySpeed += p.gravity

            const xBeforeUpdate = p.x
            p.x += p.xSpeed

            //constrain player to world bounds
            if (p.topLeft.x < -2000 / 2) {
                p.x = xBeforeUpdate
            } else if (p.bottomRight.x > 2000 / 2) {
                p.x = xBeforeUpdate
            }

            if (p.highestPosition > p.y) {
                p.score = Math.abs(Math.round(p.y/100))
                
                p.highestPosition = p.y
            }

            if (p.y > p.deathBarrierYpos) {

                playersToKill.push(p)
            }
        }
        return p
    })

    updatedState.players = kill(updatedState, playersToKill).players
    return updatedState
}

export const move = (state: Game, uid: string, movement: EPlayerMovements) => {

    const updatedState = state

    updatedState.players = state.players.map((p) => {
        if (p.uid == uid) {
            const updatedPlayer = p
            switch (movement) {
                case EPlayerMovements.left:
                    updatedPlayer.xSpeed = -updatedPlayer.movementSpeed
                    break;
                case EPlayerMovements.right:
                    updatedPlayer.xSpeed = updatedPlayer.movementSpeed
                    break;
                case EPlayerMovements.stop:
                    updatedPlayer.xSpeed = 0
                    break;
            }
            return updatedPlayer
        }
        return p
    })

    return updatedState
}