import { DecodedIdToken } from "firebase-admin/lib/auth/token-verifier"
import { Socket } from "socket.io"
import { getMongoManager, MongoEntityManager } from "typeorm"
import { Worker } from "worker_threads"
import { Game } from "../entities/Game"
import { GameRoom } from "../entities/GameRoom"
import { SocketMessages } from "../interfaces/socketMessages"
import { EPlayerMovements, WorkerMessage, WorkerMessages } from "../interfaces/workerMessage"

export class PlayerController {
    public socket: Socket
    public roomId: string
    public worker: Worker

    get uid() {
        return ((this.socket.request as any).currentUser as DecodedIdToken).uid
    }

    constructor(socket: Socket, worker: Worker, roomId: string) {
        this.socket = socket
        this.roomId = roomId
        this.worker = worker
    }

    enableListeners = () => {
        this.socket.on(SocketMessages.moveLeft, this.moveLeft)
        this.socket.on(SocketMessages.moveRight, this.moveRight)
        this.socket.on(SocketMessages.stopMoving, this.stopMoving)
        this.socket.on(SocketMessages.leaveLobby, this.leaveGame)
    }

    moveLeft = async () => {
        const message: WorkerMessage = { message: WorkerMessages.move, playerId: this.uid, movement: EPlayerMovements.left }
        this.worker.postMessage(message)
    }

    moveRight = async () => {
        const message: WorkerMessage = { message: WorkerMessages.move, playerId: this.uid, movement: EPlayerMovements.right }
        this.worker.postMessage(message)
    }

    stopMoving = async () => {
        const message: WorkerMessage = { message: WorkerMessages.move, playerId: this.uid, movement: EPlayerMovements.stop }
        this.worker.postMessage(message)
    }

    leaveGame = async () => {
        const message: WorkerMessage = { message: WorkerMessages.leaveGame, playerId: this.uid }
    };

    disableListeners = () => {
        this.socket.removeAllListeners(SocketMessages.moveRight)
        this.socket.removeAllListeners(SocketMessages.stopMoving)
        this.socket.removeAllListeners(SocketMessages.moveLeft)
        this.socket.removeListener(SocketMessages.leaveLobby, this.leaveGame)
    };



    decodeToken = (socket: Socket): DecodedIdToken => {
        return (socket.request as any).currentUser as DecodedIdToken
    }
}