import { DecodedIdToken } from 'firebase-admin/lib/auth/token-verifier'
import { Server, Socket } from 'socket.io'
import { getMongoManager, MongoEntityManager } from 'typeorm'
import { ObjectID } from 'mongodb'
import { Game } from '../entities/Game'
import { GameRoom } from '../entities/GameRoom'
import { User } from '../entities/User'
import { dirname, resolve } from 'path/posix'
import { toPromise } from '../utils/toPromise'
import { Worker, workerData } from 'worker_threads'
import { WorkerMessage, WorkerMessages } from '../interfaces/workerMessage'

export class GameController {
  public manager: MongoEntityManager
  public io: Server
  public sockets: Socket[]
  public roomId: string

  get state() {
    return (async () => {
      return await this.manager.findOne(GameRoom, this.roomId)
    })()
  }

  setState = async (value: GameRoom) => {
    const newState = await value
    if (await this.state) {
      await this.manager.update<GameRoom>(GameRoom, this.roomId, newState)
    } else {
      const res = await this.manager.save<GameRoom>(newState)
      this.roomId = res.roomId.toString()
      console.log('created Game')
    }
  }

  constructor(io: Server) {
    this.manager = getMongoManager('mongodb')
    this.io = io
    this.roomId = ObjectID()
    this.sockets = []

  }

  init = async () => {
    const newRoom = new GameRoom()
    newRoom.players = []

    // const game = new Game()
    // game._id = ObjectID()
    // game.platforms = []
    // game.players = []
    // newRoom.game = game
    newRoom.game = ''
    newRoom.hasStarted = false
    newRoom.roomId = ObjectID(this.roomId)

    console.log(newRoom);

    await this.setState(newRoom)
  }

  addPlayer = async (socket: Socket) => {
    const prevState = await this.state

    socket.join(this.roomId)
    const user = this.decodeToken(socket)

    const existingPlayer = prevState.players.find(p => p.uid == user.uid)

    const newUser = new User()
    newUser.id = ObjectID()
    newUser.displayName = user.name ? user.name : 'Guest'
    newUser.uid = user.uid

    if (!existingPlayer) {
      prevState.players.push(newUser)
    }

    if (!prevState.hostId) {
      prevState.hostId = user.uid
    }

    if (!this.sockets.includes(socket)) {
      this.sockets.push(socket)
    }

    await this.setState(prevState)
  }

  removePlayer = async (socket: Socket) => {
    const prevState = await this.state
    const user = this.decodeToken(socket)
    socket.leave(this.roomId)
    const newPlayers = prevState.players.filter(p => {
      return p.uid != user.uid
    })
    prevState.players = newPlayers

    if (user.uid == prevState.hostId && prevState.players.length > 0) {
      prevState.hostId = prevState.players[0].uid
    }

    if (this.sockets.includes(socket)) {
      const i = this.sockets.indexOf(socket)
      this.sockets.splice(i, 1)
    }

    await this.setState(prevState)

  }

  startGame = async () => {

    console.log('starting game...');

    const players = (await this.state).players.map((p) => {
      return { id: p.uid, displayName: p.displayName }
    })

    const worker = new Worker('./server/worker/worker.js', {
      workerData: {
        path: './worker.ts',
        lobbyId: this.roomId,
        players: players
      }
    });

    worker.on('message', this.handleWorkerMessage)
    const startGameMessage: WorkerMessage = { message: WorkerMessages.gameState, value: (await this.state).game }
    worker.postMessage(startGameMessage)
  }

  handleWorkerMessage = async (message: WorkerMessage) => {

    if (message.message == WorkerMessages.setGameState) {
      await this.manager.update<GameRoom>(GameRoom, this.roomId, { game: message.value })
      console.log("updated game state");
      
    }

  }

  decodeToken = (socket: Socket): DecodedIdToken => {
    return (socket.request as any).currentUser as DecodedIdToken
  }
}
