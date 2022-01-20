import { DecodedIdToken } from "firebase-admin/lib/auth/token-verifier"
import { Socket } from "socket.io"
import { getMongoManager, MongoEntityManager } from "typeorm"
import { Worker } from "worker_threads"
import { Game } from "../entities/Game"
import { GameRoom } from "../entities/GameRoom"
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
        this.socket.on('f2b_moveLeft', this.moveLeft)
        this.socket.on('f2b_moveRight', this.moveRight)
        this.socket.on('f2b_stopMoving', this.stopMoving)
        this.socket.on('f2b_leaveLobby', this.leaveGame)
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
        const message: WorkerMessage = { message: WorkerMessages.leaveGame, playerId: this.uid}
    };
    

    decodeToken = (socket: Socket): DecodedIdToken => {
        return (socket.request as any).currentUser as DecodedIdToken
    }
}