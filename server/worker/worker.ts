
import { createConnection, getMongoManager, MongoEntityManager } from "typeorm";
import { MongoConnectionOptions } from "typeorm/driver/mongodb/MongoConnectionOptions";
import { parentPort, workerData } from "worker_threads";
import { Game } from "../entities/Game";
import { PlayerObject } from "../entities/gameobjects/PlayerObject";
import { Platform } from "../entities/gameobjects/Platform";
import { GameRoom } from "../entities/GameRoom";
import { WorkerMessage, WorkerMessages } from "../interfaces/workerMessage";
import { generateLevel } from "./utils/generateLevel";




const gravity = (state: Game) => {
    const updatedState = state
    updatedState.players.forEach((p) => {
        p.y += p.ySpeed
        p.ySpeed += p.gravity
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

const createGame = () => {
    const level = generateLevel()
    const players = workerData.players.map((p, i) => {
        const playerObject = new PlayerObject(i* 50, 0, p.id, p.displayName)
        return playerObject
    })

    const game = { players: players, platforms: level }
    const message: WorkerMessage = { message: WorkerMessages.setGameState, value: JSON.stringify(game) }
    parentPort.postMessage(message)
}

const runService = (manager: MongoEntityManager) => {
    createGame()

    setInterval(async () => {
        let oldState = JSON.parse((await manager.findOne<GameRoom>(GameRoom, workerData.lobbyId)).game)

        oldState = gravity(oldState)
        oldState = collide(oldState)

        const message: WorkerMessage = { message: WorkerMessages.setGameState, value: JSON.stringify(oldState) }
        parentPort.postMessage(message)

    }, 100)
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
            runService(manager)
        })
    })()



