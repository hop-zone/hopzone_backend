export enum WorkerMessages{
    getGameState = 'getGameState',
    setGameState = 'setGameState',
    gameState = 'gameState',
    moveLeft = 'moveLeft',

    testGameState = 'testGameState'

}


export interface WorkerMessage {
    message: WorkerMessages
    value: string
}