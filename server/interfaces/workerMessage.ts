export enum WorkerMessages{
    getGameState = 'getGameState',
    setGameState = 'setGameState',
    gameState = 'gameState'

}


export interface WorkerMessage {
    message: WorkerMessages
    value: string
}