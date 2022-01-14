import { DecodedIdToken } from "firebase-admin/lib/auth/token-verifier";
import { Server, Socket } from "socket.io";
import { Game } from "../models/Game";
import { GameRoom } from "../models/GameRoom";


export class GameController {


    public roomId: number
    private hostName: string
    private io: Server
    private sockets: Socket[]
    private game: Game = { players: [], platforms: [] }
    private hasStarted: boolean = false

    constructor(io: Server, socket: Socket, roomId: number) {
        this.io = io
        socket.join(roomId.toString())
        this.sockets = [socket]
        this.roomId = roomId
        this.hostName = ((socket.request as any).currentUser as DecodedIdToken).name
    }

    addPlayer = async (socket: Socket) => {
        socket.join(this.roomId.toString())

        const user = (socket.request as any).currentUser as DecodedIdToken
        const players: DecodedIdToken[] = this.sockets.map((s) => {
            return (s.request as any).currentUser as DecodedIdToken
        })

        if (players.find(p => p.uid == user.uid)) return

        this.sockets.push(socket)
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