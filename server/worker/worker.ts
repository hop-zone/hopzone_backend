
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
import { generateBoostedPlatforms, generateMovingPlatforms, generatePlatforms } from "./utils/platformGeneration";
import { movePlatforms } from "./utils/platformMovement";
import { collide } from "./utils/collision";
import { gravity, move } from "./utils/playerMovement";
import { Enemy } from "../entities/gameobjects/Enemy";
import { moveEnemies } from "./utils/enemyMovement";
import { generateEnemies } from "./utils/enemyGeneration";


interface IPlayerMovement {
    uid: string
    movement: EPlayerMovements
}

const playerMovements: IPlayerMovement[] = []

let runner;
let uidToRemove: string;


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
    const enemies = [new Enemy(getRandomInt(-1000, 1000), getRandomInt(-1000, -2000))]

    const game = new Game()
    game.players = players
    game.alivePlayers = players.length
    game.deadPlayers = 0
    game.platforms = platforms
    game.movingPlatforms = movingPlatforms
    game.boostedPlatforms = boostedPlatforms
    game.enemies = enemies
    const message: WorkerMessage = { message: WorkerMessages.setGameState, state: game }
    parentPort.postMessage(message)

}

const runService = async (manager: MongoEntityManager) => {
    await createGame()

    console.log(`Game with ID ${workerData.lobbyId} has started.`);
    
    runner = setInterval(async () => {
        try {
            let oldState = (await manager.findOne<GameRoom>(GameRoom, workerData.lobbyId)).game

            if (oldState.alivePlayers == 0) {
                console.log(`Everyone dead in lobby with ID ${workerData.lobbyId}, quitting...`)
                stopService()
            } else {
                oldState = leaveGame(oldState)
                oldState = gravity(oldState)
                oldState = movePlatforms(oldState)
                oldState = moveEnemies(oldState)
                oldState = collide(oldState)
                playerMovements.map((p) => {
                    oldState = move(oldState, p.uid, p.movement)
                })

                oldState = generatePlatforms(oldState)
                oldState = generateMovingPlatforms(oldState)
                oldState = generateBoostedPlatforms(oldState)
                oldState = generateEnemies(oldState)

                const message: WorkerMessage = { message: WorkerMessages.setGameState, state: oldState }
                parentPort.postMessage(message)
            }


        } catch (e) {
            console.log(`Something went wrong in the workerthread from lobby ${workerData.lobbyId}, quitting...`, e);
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
    const message: WorkerMessage = { message: WorkerMessages.exit }
    parentPort.postMessage(message)
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
        console.log(`Stopping workerThread for lobby with ID ${workerData.lobbyId}`);
        stopService()
    }

    if (message.message == WorkerMessages.leaveGame) {
        uidToRemove = message.playerId
    }
}
    ; (() => {

        let entitiesDir
        if (process.env.NODE_ENV == 'production') {
            entitiesDir = '/usr/app' + process.env.ENTITIES_DIR
        } else {
            entitiesDir = __dirname.split('server/')[0] + process.env.ENTITIES_DIR
        }
    

        const conn: MongoConnectionOptions = {
            name: 'mongodb',
            type: 'mongodb',
            url: process.env.DB_CONNECTION_URL,
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



