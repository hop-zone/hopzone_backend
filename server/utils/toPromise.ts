import { GameRoom } from '../entities/GameRoom'

export const toPromise = (gameRoom: GameRoom): Promise<GameRoom> => {
  return new Promise(resolve => {
    resolve(gameRoom)
  })
}
