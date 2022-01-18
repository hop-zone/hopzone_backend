import { Game } from "../entities/Game";

export enum EPlayerMovements {
    left = 'left',
    right = 'right',
    stop = 'stop',
}

export enum WorkerMessages{
    getGameState = 'getGameState',
    setGameState = 'setGameState',
    gameState = 'gameState',
    moveLeft = 'moveLeft',
    moveRight = 'moveRight',
    stopMoving = 'stopMoving',
    move = 'move',
    testGameState = 'testGameState'

}


export interface WorkerMessage {
    message: WorkerMessages
    state?: Game
    playerId?: string
    movement?: EPlayerMovements
}