import { Server, Socket } from 'socket.io'
import { getMongoManager, MongoEntityManager } from 'typeorm'
import { ObjectID } from 'mongodb'
import { GameRoom } from '../entities/GameRoom'
import { User } from '../entities/User'
import { Worker } from 'worker_threads'
import { WorkerMessage, WorkerMessages } from '../interfaces/workerMessage'
import { PlayerController } from './playerController'
import { decodeToken } from '../utils/decodeToken'
import { SocketMessages } from '../interfaces/socketMessages'

export class GameController {
  public manager: MongoEntityManager
  public io: Server
  public sockets: Socket[]
  public worker: Worker
  public playerControllers: PlayerController[]
  public roomId: string

  get state() {
    return (async () => {
      return await this.manager.findOne(GameRoom, this.roomId)
    })()
  }

  setState = async (value: GameRoom) => {
    try {
      const newState = value
      if (await this.state) {
        await this.manager.update<GameRoom>(GameRoom, this.roomId, newState)
      } else {
        const res = await this.manager.save<GameRoom>(newState)
        this.roomId = res.roomId.toString()
        console.log(`Successfully created a new game session with ID: ${this.roomId}`)
      }
    } catch (error) {
      console.log("Something went wrong trying to save the game state: " + error);

    }

  }

  constructor(io: Server) {
    this.manager = getMongoManager('mongodb')
    this.io = io
    this.roomId = ObjectID()
    this.sockets = []

  }

  init = async () => {
    try {
      const newRoom = new GameRoom()
      newRoom.players = []
      newRoom.hasStarted = false
      newRoom.hasEnded = false
      newRoom.roomId = ObjectID(this.roomId)

      await this.setState(newRoom)

      return newRoom
    } catch (error) {
      console.log("Something went wrong while initializing the game room: " + error);

    }

  }

  addPlayer = async (socket: Socket) => {
    try {
      const prevState = await this.state

      socket.join(this.roomId)
      const user = decodeToken(socket)

      const existingPlayer = prevState.players.find(p => p.uid == user.uid)

      const newUser = new User()
      newUser._id = ObjectID()
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
    } catch (error) {
      console.log("Something went wrong while adding a player to the lobby: " + error);
    }

  }

  removePlayer = async (socket: Socket) => {
    try {
      console.log(`Removing player ${decodeToken(socket).name} from lobby ${this.roomId}`)

      const prevState = await this.state
      const user = decodeToken(socket)
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

      if (this.worker) {
        if (prevState.players.length == 0) {
          const message: WorkerMessage = { message: WorkerMessages.exit }
          this.worker.postMessage(message)
        } else {
          const message: WorkerMessage = { message: WorkerMessages.leaveGame, playerId: user.uid }
          this.worker.postMessage(message)
        }

      }

      await this.setState(prevState)
    } catch (error) {
      console.log("Something went wrong while trying to remove player from the lobby: " + error);

    }

  }

  startGame = async () => {

    try {
      console.log(`Starting game with ID: ${this.roomId}`);

      this.io.to(this.roomId).emit(SocketMessages.gameLoading)

      const players = (await this.state).players.map((p) => {
        return { id: p.uid, displayName: p.displayName }
      })



      const env = process.env.NODE_ENV || 'developmenbt'
      let path = './server/worker/worker.js'

      if (env == 'production') path = './worker/worker.js'

      const worker = new Worker(path, {
        workerData: {
          path: './worker.ts',
          lobbyId: this.roomId,
          players: players
        }
      });

      this.worker = worker

      this.playerControllers = this.sockets.map((s) => {
        const controller = new PlayerController(s, worker, this.roomId)
        controller.enableListeners()
        return controller

      })

      worker.on('message', this.handleWorkerMessage)

      const rooms = (await this.manager.find<GameRoom>(GameRoom)).filter((r) => { return r.players.length < 4 && r.hasEnded == false && r.hasStarted == false && r.roomId.toString() != this.roomId })

      this.io.emit(SocketMessages.activeRooms, rooms)
    } catch (error) {
      console.log("Something went wrong while starting a game: " + error);
    }
  }

  restartGame = async () => {
    try {
      await this.manager.update<GameRoom>(GameRoom, this.roomId, { hasStarted: false, hasEnded: false, game: undefined })
      const state = await this.state
      this.io.to(this.roomId).emit(SocketMessages.gameState, state)
    } catch (error) {
      console.log("Something went wrong whwile restarting the game: " + error);
    }
  };


  handleWorkerMessage = async (message: WorkerMessage) => {
    try {
      if (message.message == WorkerMessages.setGameState) {
        await this.manager.update<GameRoom>(GameRoom, this.roomId, { hasStarted: true, game: message.state })
        this.io.to(this.roomId).emit(SocketMessages.gameState, await this.state)
      }

      if (message.message == WorkerMessages.exit) {

        console.log(`Workerthread for lobby ${this.roomId} exited.`)

        this.playerControllers.map((c) => {
          c.disableListeners()
        })
        this.playerControllers = []
        await this.saveHighScores()
        await this.manager.update<GameRoom>(GameRoom, this.roomId, { hasStarted: false, hasEnded: true })
        this.io.to(this.roomId).emit(SocketMessages.gameState, await this.state)
      }
    } catch (error) {
      console.log("Something went wrong while handling a message from the worker thread: " + error);

    }
  }

  saveHighScores = async () => {
    try {
      const gameState = await this.state

      if (gameState.game) {
        gameState.game.players.map(async (p) => {
          const user = await this.manager.findOne<User>(User, { uid: p.uid })


          if (user) {
            if (user.highScore < p.score) {
              await this.manager.update<User>(User, user._id, { highScore: p.score, highScoreDate: new Date() })
            }
          } else {
            const newUser = new User()

            newUser.uid = p.uid
            newUser.displayName = p.displayName
            newUser.highScore = p.score
            newUser.highScoreDate = new Date()

            await this.manager.save<User>(newUser)
          }
        })
      }
    } catch (error) {
      console.log("Something went wrong while saving the highscores: " + error);

    }
  };

}
