
import { createConnection, getMongoManager, MongoEntityManager, MongoRepository } from "typeorm";
import { MongoConnectionOptions } from "typeorm/driver/mongodb/MongoConnectionOptions";
import { parentPort, workerData } from "worker_threads";
import { Game } from "../entities/Game";
import { PlayerObject } from "../entities/gameobjects/PlayerObject";
import { Platform } from "../entities/gameobjects/Platform";
import { GameRoom } from "../entities/GameRoom";
import { EPlayerMovements, WorkerMessage, WorkerMessages } from "../interfaces/workerMessage";
import { generateLevel } from "./utils/generateLevel";
import { ObjectID } from 'mongodb'
import { getRandomInt } from "./utils/getRandomInt";
import { MovingPlatform } from "../entities/gameobjects/MovingPlatform";
import { BoostedPlatform } from "../entities/gameobjects/BoostedPlatform";


interface IPlayerMovement {
    uid: string
    movement: EPlayerMovements
}

const playerMovements: IPlayerMovement[] = []

let runner;
let uidToRemove: string;

const kill = (state: Game, players: PlayerObject[]) => {
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

const gravity = (state: Game) => {
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

const collide = (state: Game) => {
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

const move = (state: Game, uid: string, movement: EPlayerMovements) => {

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

const movePlatforms = (state: Game) => {
    state.movingPlatforms = state.movingPlatforms.map((p) => {
        p.x += p.xSpeed

        if (Math.abs(p.originXpos - p.x) > p.movingRange) {
            p.xSpeed = -p.xSpeed
        }
        return p
    })

    return state
}

const generatePlatforms = (oldState: Game) => {
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

    const highestMovingPlatform = Math.min.apply(
        Math,
        state.movingPlatforms.map(function (o) {
            return o.y
        }),
    )

    const highestBoostedPlatform = Math.min.apply(
        Math,
        state.boostedPlatforms.map(function (o) {
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

    const lowestBoostedPlatform = Math.max.apply(
        Math,
        state.boostedPlatforms.map(function (o) {
            return o.y
        }),
    )

    const lowestMovingPlatform = Math.max.apply(
        Math,
        state.movingPlatforms.map(function (o) {
            return o.y
        }),
    )



    let copyOfPlatforms = [...state.platforms]
    let copyOfMovingPlatforms = [...state.movingPlatforms]
    let copyOfBoostedPlatforms = [...state.boostedPlatforms]

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
            // highestPlatformObject = newPlatform
            copyOfPlatforms.push(newPlatform)
        }
    }

    if (highestPlayer < highestMovingPlatform + 100) {
        const newPlatform: MovingPlatform = new MovingPlatform(getRandomInt(-1000, 1000), getRandomInt(highestMovingPlatform, highestMovingPlatform - 2000),)
        copyOfMovingPlatforms.push(newPlatform)
    }

    if (highestPlayer < highestBoostedPlatform + 100) {
        const newPlatform: BoostedPlatform = new BoostedPlatform(getRandomInt(-1000, 1000), getRandomInt(highestMovingPlatform, highestMovingPlatform - 2000),)
        copyOfBoostedPlatforms.push(newPlatform)
    }

    if (lowestPlayer < lowestPlatform - 1000) {
        copyOfPlatforms = copyOfPlatforms.filter((p: Platform) => {
            return p.y != lowestPlatform
        })
    }

    if (lowestPlayer < lowestMovingPlatform - 1000) {
        copyOfMovingPlatforms = copyOfMovingPlatforms.filter((p: MovingPlatform) => {
            return p.y != lowestMovingPlatform
        })
    }

    if (lowestPlayer < lowestBoostedPlatform - 1000) {
        copyOfBoostedPlatforms = copyOfBoostedPlatforms.filter((p: BoostedPlatform) => {
            return p.y != lowestMovingPlatform
        })
    }

    state.platforms = copyOfPlatforms
    state.movingPlatforms = copyOfMovingPlatforms
    state.boostedPlatforms = copyOfBoostedPlatforms

    return state
}

const leaveGame = (oldState: Game) => {
    const updatedState = oldState

    if (uidToRemove) {
        const playertoremove = updatedState.players.find((p) => { return p.uid == uidToRemove })

        if (playertoremove) {
            const i = updatedState.players.indexOf(playertoremove)
            updatedState.players[i].isDead = true
        }
    }

    return updatedState
};


const createGame = async () => {
    const platforms = generateLevel()
    // const platforms = []
    const players = workerData.players.map((p, i) => {
        const playerObject = new PlayerObject(i * 100, -50, p.id, i, p.displayName)
        platforms.push(new Platform(playerObject.x, 0, getRandomInt(0, 3)))
        return playerObject
    })

    const movingPlatforms = [new MovingPlatform(getRandomInt(-1000, 1000), getRandomInt(0, -500))]
    const boostedPlatforms = [new BoostedPlatform(getRandomInt(-1000, 1000), getRandomInt(0, -500))]

    const game = new Game()
    game.players = players
    game.alivePlayers = players.length
    game.deadPlayers = 0
    game.platforms = platforms
    game.movingPlatforms = movingPlatforms
    game.boostedPlatforms = boostedPlatforms
    const message: WorkerMessage = { message: WorkerMessages.setGameState, state: game }
    parentPort.postMessage(message)

}

const runService = async (manager: MongoEntityManager) => {
    await createGame()

    runner = setInterval(async () => {
        try {
            let oldState = (await manager.findOne<GameRoom>(GameRoom, workerData.lobbyId)).game

            if (oldState.alivePlayers == 0) {
                console.log('everyone dead, quitting...');
                const message: WorkerMessage = { message: WorkerMessages.endGame }
                parentPort.postMessage(message)
                stopService()
            } else {
                oldState = leaveGame(oldState)
                oldState = gravity(oldState)
                oldState = movePlatforms(oldState)
                oldState = collide(oldState)
                playerMovements.map((p) => {
                    oldState = move(oldState, p.uid, p.movement)
                })

                oldState = generatePlatforms(oldState)

                const message: WorkerMessage = { message: WorkerMessages.setGameState, state: oldState }
                parentPort.postMessage(message)
            }


        } catch (e) {
            console.log("something went wrong, exiting thread... ", e);
            stopService()
        }

    }, 16)

    parentPort.on('message', (message: WorkerMessage) => {
        handleParentMessage(message, manager)
    })
}

const stopService = () => {
    if (runner) {
        clearInterval(runner)
    }
    parentPort.close()
}

const handleParentMessage = async (message: WorkerMessage, manager: MongoEntityManager) => {
    if (message.message == WorkerMessages.move) {
        const p = playerMovements.find((p) => { p.uid == message.playerId })
        if (p) {
            const index = playerMovements.indexOf(p)
            p.movement = message.movement
            playerMovements[index] = p
        } else {
            playerMovements.push({ uid: message.playerId, movement: message.movement })
        }
    }

    if (message.message == WorkerMessages.exit) {
        console.log("stopping worker thread...");
        stopService()
    }

    if (message.message == WorkerMessages.leaveGame) {
        uidToRemove = message.playerId
    }
}
    ; (() => {
        const entitiesDir = __dirname.split('server/')[0] + '/server/entities/**/*{.ts,.js}'
        const conn: MongoConnectionOptions = {
            name: 'mongodb',
            type: 'mongodb',
            url: `mongodb://root:example@127.0.0.1:27017/`,
            useNewUrlParser: true,
            synchronize: true,
            logging: true,
            useUnifiedTopology: true,
            entities: [entitiesDir],
        }

        createConnection(conn).then(async (connection) => {
            const manager = getMongoManager('mongodb')
            runService(manager)
        })
    })()



