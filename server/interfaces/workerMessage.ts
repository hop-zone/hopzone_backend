import { Game } from "../entities/Game";
import { GameRoom } from "../entities/GameRoom";

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
    endGame = 'endGame',
    exit = 'exit',
    testGameState = 'testGameState',
    leaveGame = 'leaveGame'

}


export interface WorkerMessage {
    message: WorkerMessages
    state?: Game
    playerId?: string
    movement?: EPlayerMovements
}