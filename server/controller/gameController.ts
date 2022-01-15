
import { DecodedIdToken } from "firebase-admin/lib/auth/token-verifier";
import { Server, Socket } from "socket.io";
import { getMongoManager, MongoEntityManager } from "typeorm";
import { ObjectID } from 'mongodb';
import { Game } from "../entities/Game";
import { GameRoom } from "../entities/GameRoom";
import { User } from "../entities/User";


export class GameController {

    public manager: MongoEntityManager

    public io: Server
    public hostId: string
    public players: User[]
    public roomId: string
    public game: Game
    public hasStarted: boolean = false

    get gameState(): GameRoom {
        const room = new GameRoom()
        room.roomId = ObjectID(this.roomId)
        room.players = this.players
        room.game = this.game
        room.hasStarted = this.hasStarted
        room.hostId = this.hostId
        return room
    }

    constructor(io: Server) {
        this.manager = getMongoManager('mongodb')
        this.io = io
        this.roomId = ObjectID()

        this.players = []
    }

    addPlayer = async (socket: Socket) => {
        socket.join(this.roomId)
        const user = this.decodeToken(socket)
        const existingPlayer = this.players.find(p => p.uid == user.uid)

        const newUser = new User()
        newUser.id = ObjectID()
        newUser.displayName = user.name ? user.name : 'Guest'
        newUser.uid = user.uid
        if (!existingPlayer) {
            this.players.push(newUser)
        }

        if (!this.hostId) {
            this.hostId = user.uid
        }

        await this.saveGameState()

    }

    removePlayer = async (socket: Socket) => {
        const user = this.decodeToken(socket)
        socket.leave(this.roomId)
        const newPlayers = this.players.filter((p) => { return p.uid != user.uid })
        this.players = newPlayers;

        if (user.uid == this.hostId && this.players.length > 0) {
            this.hostId = this.players[0].uid
        }

        await this.saveGameState()

    }

    saveGameState = async () => {
        const room: GameRoom | undefined = await this.manager.findOne(GameRoom, this.roomId)
        if (room) {
            await this.manager.update<GameRoom>(GameRoom, this.roomId, this.gameState)
            console.log('saved game');
        } else {
            const res = await this.manager.save<GameRoom>(this.gameState)
            this.roomId = res.roomId.toString()
            console.log('created game');
        }
    }


    decodeToken = (socket: Socket): DecodedIdToken => {
        return (socket.request as any).currentUser as DecodedIdToken
    }
}