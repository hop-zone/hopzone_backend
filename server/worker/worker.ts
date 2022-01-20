
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
        updatedState.players.splice(i, 1)

        const deadplayer = state.deadPlayers.find((dead) => {return p.uid == dead.uid})

        if(!deadplayer){
            updatedState.deadPlayers.push(p)
        }
    })

    return updatedState
}

const gravity = (state: Game) => {
    const updatedState = state
    const playersToKill: PlayerObject[] = []

    updatedState.players.forEach((p, i) => {
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
    })


    updatedState.players = kill(updatedState, playersToKill).players
    return updatedState
}

const collide = (state: Game) => {
    const updatedState = state
    updatedState.players = updatedState.players.map((player) => {
        const updatedPlayer = new PlayerObject(player.x, player.y, player.uid, player.playerNum, player.displayName, player.highestPosition)
        updatedPlayer.ySpeed = player.ySpeed
        let collided = false
        state.platforms.map((platform) => {
            const platformObject = new Platform(platform.x, platform.y, platform.platformType)
            if (updatedPlayer.intersects(platformObject) && updatedPlayer.ySpeed > 0) {
                collided = true
            }
        })

        if (collided) {
            updatedPlayer.ySpeed = -updatedPlayer.maxSpeed
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

    if (highestPlayer < highestPlatform + 100) {
        for (let i = 0; i < 2; i++) {
            const newPlatform: Platform = new Platform(
                getRandomInt(-1000, 1000),
                getRandomInt(highestPlatform, highestPlatform - 100),
                getRandomInt(0, 3)
            )
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

const leaveGame = (oldState: Game) => {
  const updatedState = oldState

  if(uidToRemove){
      const playertoremove = updatedState.players.find((p) => {return p.uid == uidToRemove})

      if(playertoremove){
          const i = updatedState.players.indexOf(playertoremove)
          updatedState.players.splice(i, 1)
      }
  }

  return updatedState
};


const createGame = async () => {
    const level = generateLevel()
    const players = workerData.players.map((p, i) => {
        const playerObject = new PlayerObject(i * 100, -400, p.id, i, p.displayName)
        return playerObject
    })

    const game = new Game()
    game.players = players
    game.deadPlayers = []
    game.platforms = level
    const message: WorkerMessage = { message: WorkerMessages.setGameState, state: game }
    parentPort.postMessage(message)

}

const runService = async (manager: MongoEntityManager) => {
    await createGame()

    runner = setInterval(async () => {
        try {
            let oldState = (await manager.findOne<GameRoom>(GameRoom, workerData.lobbyId)).game

            if (oldState.players.length == 0) {
                console.log('everyone dead, quitting...');
                const message: WorkerMessage = { message: WorkerMessages.endGame }
                parentPort.postMessage(message)
                stopService()
            } else {
                oldState = leaveGame(oldState)
                oldState = gravity(oldState)
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

    if(message.message == WorkerMessages.leaveGame) {
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



