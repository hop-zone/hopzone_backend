import { DecodedIdToken } from "firebase-admin/lib/auth/token-verifier";
import { Game } from "./Game";


export interface GameRoom {
    roomId: number
    game: Game
    hostName: string
    players: DecodedIdToken[]
    hasStarted: boolean
}