import { DecodedIdToken } from "firebase-admin/lib/auth/token-verifier";
import { Server, Socket } from "socket.io";
import { getMongoManager, MongoEntityManager } from "typeorm";
import { GameRoom } from "../entities/GameRoom";
import { GameController } from "./gameController";




export class ServerController {

    public io: Server
    public manager: MongoEntityManager

    private gameControllers: GameController[]

    constructor(io: Server) {
        this.manager = getMongoManager('mongodb')
        this.io = io
        this.gameControllers = []
        this.restoreSessions()
    }

    restoreSessions = async () => {
        const sessions = await this.manager.find<GameRoom>(GameRoom)
        const restoredRooms = sessions.map((room) => {
            const restoredRoom = new GameController(this.io)
            restoredRoom.roomId = room.roomId.toString()
            restoredRoom.hasStarted = room.hasStarted
            restoredRoom.players = room.players
            restoredRoom.game = room.game
            restoredRoom.hostId = room.hostId

            return restoredRoom
        })

        this.gameControllers = restoredRooms

    }

    enableListeners = () => {
        this.io.on('connection', this.newConnection)
    }

    newConnection = async (socket: Socket) => {
        const activeRooms = await this.getRooms()

        this.enableSocketListeners(socket)

        socket.emit('b2f_gamerooms', activeRooms)
    }

    enableSocketListeners = (socket: Socket) => {
        socket.on('f2b_newLobby', () => {
            this.onCreateLobby(socket)
        })

        socket.on('f2b_joinLobby', (lobbyId: string) => {

            this.onJoinLobby(socket, lobbyId)
        })

        socket.on('f2b_leaveLobby', (lobbyId: string) => {
            this.onLeaveLobby(socket, lobbyId)
        })

        socket.on('disconnect', () => {
            this.onSocketDisconnect(socket)
        })
    }

    onSocketDisconnect = async (socket: Socket) => {
        this.gameControllers.map((controller) => {
            controller.removePlayer(socket)
        })
    }

    onCreateLobby = async (socket: Socket) => {
        const hostName = ((socket.request as any).currentUser as DecodedIdToken).name
        const name = hostName ? hostName : 'Guest'
        const newRoom = new GameController(this.io)
        await newRoom.saveGameState()
        this.gameControllers.push(newRoom)

        socket.emit('b2f_lobby', newRoom.gameState)

        const activeRooms = await this.getRooms()
        this.io.emit('b2f_gamerooms', activeRooms)

    }

    onJoinLobby = async (socket: Socket, roomId: string) => {
        const lobby = this.gameControllers.find((controller) => {
            return controller.roomId == roomId
        })

        if (lobby) {
            await lobby.addPlayer(socket)

            this.io.to(roomId).emit('b2f_lobby', lobby.gameState)
            this.io.emit('b2f_gamerooms', await this.getRooms())
        }
    }

    onLeaveLobby = async (socket: Socket, roomId: string) => {
        const lobby = this.gameControllers.find((controller) => {
            return controller.roomId == roomId
        })
        if (lobby) {
            await lobby.removePlayer(socket)



            if (lobby.players.length == 0) {
                const i = this.gameControllers.indexOf(lobby)
                this.gameControllers.splice(i)
                const roomToDelete = await this.manager.findOne(GameRoom, lobby.roomId)
                console.log(roomToDelete);

                if (roomToDelete) await this.manager.deleteOne(GameRoom, roomToDelete)

            }
            this.io.emit('b2f_gamerooms', await this.getRooms())
            this.io.to(lobby.roomId).emit('b2f_lobby', await this.getRoom(roomId))
        }
    }

    getRooms = async () => {
        return this.manager.find<GameRoom>(GameRoom)
    }

    getRoom = async (roomId: string) => {
        return this.manager.findOne(GameRoom, roomId)
    }

}