
import { createConnection, getMongoManager, MongoEntityManager, MongoRepository } from "typeorm";
import { MongoConnectionOptions } from "typeorm/driver/mongodb/MongoConnectionOptions";
import { parentPort, workerData } from "worker_threads";
import { Game } from "../entities/Game";
import { PlayerObject } from "../entities/gameobjects/PlayerObject";
import { Platform } from "../entities/gameobjects/Platform";
import { GameRoom } from "../entities/GameRoom";
import { WorkerMessage, WorkerMessages } from "../interfaces/workerMessage";
import { generateLevel } from "./utils/generateLevel";
import { ObjectID } from 'mongodb'
import { getRandomInt } from "./utils/getRandomInt";


enum EPlayerMovements {
    left = 'left',
    right = 'right',
    stop = 'stop',
}

interface IPlayerMovement {
    uid: string
    movement: EPlayerMovements
}

const playerMovements: IPlayerMovement[] = []


const gravity = (state: Game) => {
    const updatedState = state
    updatedState.players.forEach((p) => {
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
    })
    return updatedState
}

const collide = (state: Game) => {
    const updatedState = state
    updatedState.players = updatedState.players.map((player) => {
        const updatedPlayer = new PlayerObject(player.x, player.y, player.uid, player.displayName)
        updatedPlayer.ySpeed = player.ySpeed
        let collided = false
        state.platforms.map((platform) => {
            const platformObject = new Platform(platform.x, platform.y)
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
        for (let i = 0; i < 4; i++) {
            const newPlatform: Platform = new Platform(
                getRandomInt(-1000, 1000),
                getRandomInt(highestPlatform, highestPlatform - 100),
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

const createGame = async (repo: MongoRepository<GameRoom>) => {
    const level = generateLevel()
    const players = workerData.players.map((p, i) => {
        const playerObject = new PlayerObject(i * 100, -400, p.id, p.displayName)
        return playerObject
    })

    const game = new Game()
    game.players = players
    game.platforms = level
    const message: WorkerMessage = { message: WorkerMessages.setGameState, state: game }
    parentPort.postMessage(message)

}

const runService = async (manager: MongoEntityManager, repo: MongoRepository<GameRoom>) => {
    await createGame(repo)

    setInterval(async () => {
        let oldState = (await manager.findOne<GameRoom>(GameRoom, workerData.lobbyId)).game

        oldState = gravity(oldState)
        oldState = collide(oldState)
        playerMovements.map((p) => {
            oldState = move(oldState, p.uid, p.movement)
        })

        oldState = generatePlatforms(oldState)

        const message: WorkerMessage = { message: WorkerMessages.setGameState, state: oldState }
        parentPort.postMessage(message)

    }, 16)

    parentPort.on('message', (message: WorkerMessage) => {
        handleParentMessage(message, manager)
    })
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

const handleParentMessage = async (message: WorkerMessage, manager: MongoEntityManager) => {

    if (message.message == WorkerMessages.moveLeft) {
        const p = playerMovements.find((p) => { p.uid == message.playerId })
        if (p) {
            const index = playerMovements.indexOf(p)
            p.movement == EPlayerMovements.left
            playerMovements[index] = p
        } else {
            playerMovements.push({ uid: message.playerId, movement: EPlayerMovements.left })
        }
    } else if (message.message == WorkerMessages.moveRight) {
        const p = playerMovements.find((p) => { p.uid == message.playerId })
        if (p) {
            const index = playerMovements.indexOf(p)
            p.movement == EPlayerMovements.right
            playerMovements[index] = p
        } else {
            playerMovements.push({ uid: message.playerId, movement: EPlayerMovements.right })
        }
    } else if (message.message == WorkerMessages.stopMoving) {
        const p = playerMovements.find((p) => { p.uid == message.playerId })
        if (p) {
            const index = playerMovements.indexOf(p)
            p.movement == EPlayerMovements.stop
            playerMovements[index] = p
        } else {
            playerMovements.push({ uid: message.playerId, movement: EPlayerMovements.stop })
        }
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

        console.log(__dirname);

        createConnection(conn).then(async (connection) => {
            const manager = getMongoManager('mongodb')
            const repo = connection.getMongoRepository(GameRoom)
            const playerRepo = connection.getMongoRepository<PlayerObject>(PlayerObject)

            const players = await playerRepo.find()

            console.log('kheb de spelers')
            console.log(players);

            runService(manager, repo)
        })
    })()



