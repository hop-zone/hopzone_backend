import { Game } from "../entities/Game";

export enum WorkerMessages{
    getGameState = 'getGameState',
    setGameState = 'setGameState',
    gameState = 'gameState',
    moveLeft = 'moveLeft',
    moveRight = 'moveRight',
    stopMoving = 'stopMoving',
    testGameState = 'testGameState'

}


export interface WorkerMessage {
    message: WorkerMessages
    state?: Game
    playerId?: string
}