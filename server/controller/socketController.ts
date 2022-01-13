import { Server, Socket } from "socket.io";

export class SocketController {
    public io: Server
    public socket: Socket

    constructor(io: Server, socket: Socket) {
        this.io = io
        this.socket = socket
    }

    createLobby = async () => {
        console.log("Creating new lobby");

        const lobbyId = Date.now()
        this.io.emit('b2f_lobbyId', { lobbyId: lobbyId })
    }
}