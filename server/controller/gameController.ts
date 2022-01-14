import { DecodedIdToken } from "firebase-admin/lib/auth/token-verifier";
import { Server, Socket } from "socket.io";
import { Game } from "../models/Game";
import { GameRoom } from "../models/GameRoom";


export class GameController {


    public roomId: number
    private hostName: string
    private io: Server
    public sockets: Socket[]
    private game: Game = { players: [], platforms: [] }
    private hasStarted: boolean = false

    constructor(io: Server, roomId: number, hostName: string) {
        this.io = io
        this.sockets = []
        this.roomId = roomId
        this.hostName = hostName
    }

    addPlayer = async (socket: Socket) => {
        socket.join(this.roomId.toString())

        const user = (socket.request as any).currentUser as DecodedIdToken
        const players: DecodedIdToken[] = this.sockets.map((s) => {
            return (s.request as any).currentUser as DecodedIdToken
        })


        const existingPlayer = players.find(p => p.uid == user.uid)

        if (existingPlayer) {
            this.removePlayer(socket)
        }

        this.sockets.push(socket)

        socket.on('disconnect', () => {
            this.removePlayer(socket)
        })
    }

    removePlayer = (socket: Socket) => {
        socket.leave(this.roomId.toString())
        const i = this.sockets.indexOf(socket)
        this.sockets.splice(i, 1)
        this.io.to(this.roomId.toString()).emit('b2f_lobby', this.getGameState())

        // console.log("removing");

    }

    getGameState = (): GameRoom => {

        const players: DecodedIdToken[] = this.sockets.map((s) => {
            return (s.request as any).currentUser as DecodedIdToken
        })


        return {
            roomId: this.roomId,
            players: players,
            game: this.game,
            hasStarted: this.hasStarted,
            hostName: this.hostName
        }
    }
}