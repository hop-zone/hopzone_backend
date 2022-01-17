import { Connection, createConnection, getMongoManager, MongoEntityManager } from "typeorm";
import { MongoConnectionOptions } from "typeorm/driver/mongodb/MongoConnectionOptions";
import { parentPort, workerData } from "worker_threads";
import { Game } from "../entities/Game";
import { PlayerObject } from "../entities/gameobjects/PlayerObject";
import { GameRoom } from "../entities/GameRoom";
import { generateLevel } from "./utils/generateLevel";


let manager: MongoEntityManager

const gravity = (state: Game) => {
    const updatedState = state
    updatedState.players.forEach((p) => {
        p.y += p.ySpeed
        p.ySpeed += p.gravity
    })

    console.log(updatedState);

    return updatedState
}

const gameProcess = async (connection: Connection) => {

    // const oldState = await connection.manager.findOne(GameRoom, workerData.lobbyId)

    // console.log(oldState);



}

const createGame = async (connection: Connection) => {
    const oldState = await manager.findOne(GameRoom, workerData.roomId)


    const players = oldState.players.map((p) => {
        return new PlayerObject(0, 0)
    })

    const level = generateLevel()

    const game = { player: players, platforms: level }

    // console.log(game);

    oldState.game = JSON.stringify(game)

    const res = await manager.update<GameRoom>(GameRoom, workerData.roomId, oldState)

    console.log(res);
    

    // const res = await manager.updateOne<GameRoom>(GameRoom, {'roomId': workerData.roomId}, { '$set': { game: oldState.game } })

    // parentPort.postMessage(oldState.game)
    // console.log(res);
    


}
    ; (async () => {
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

        await createConnection(conn).then(async (connection) => {
            manager = getMongoManager('mongodb')
            await createGame(connection)
            gameProcess(connection)
        })
    })()
