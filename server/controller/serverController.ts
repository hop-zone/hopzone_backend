import { DecodedIdToken } from 'firebase-admin/lib/auth/token-verifier'
import { Server, Socket } from 'socket.io'
import { getMongoManager, MongoEntityManager } from 'typeorm'
import { GameRoom } from '../entities/GameRoom'
import { User } from '../entities/User'
import { GameController } from './gameController'

export class ServerController {
  public io: Server
  public manager: MongoEntityManager

  private gameControllers: GameController[]

  constructor(io: Server) {
    this.manager = getMongoManager('mongodb')
    this.io = io
    this.gameControllers = []
    this.restoreSessions()
  }

  restoreSessions = async () => {
    const sessions = await this.manager.find<GameRoom>(GameRoom)
    const restoredRooms = sessions.map(room => {
      const restoredRoom = new GameController(this.io)
      restoredRoom.roomId = room.roomId.toString()

      return restoredRoom
    })

    this.gameControllers = restoredRooms
  }

  enableListeners = () => {
    this.io.on('connection', this.newConnection)
  }

  newConnection = async (socket: Socket) => {
    const activeRooms = await this.getRooms()

    this.enableSocketListeners(socket)

    socket.emit('b2f_gamerooms', activeRooms)
  }

  enableSocketListeners = (socket: Socket) => {
    socket.on('f2b_newLobby', () => {
      this.onCreateLobby(socket)
    })

    socket.on('f2b_joinLobby', (lobbyId: string) => {
      this.onJoinLobby(socket, lobbyId)
    })

    socket.on('f2b_leaveLobby', (lobbyId: string) => {
      this.onLeaveLobby(socket, lobbyId)
    })

    socket.on('f2b_startGame', (lobbyId: string) => {
      this.onStartGame(lobbyId)
    })

    socket.on('f2b_restartGame', (lobbyId: string) => {

      this.onRestartGame(lobbyId)
    }
    )

    socket.on('f2b_scoreboard', () => {
      this.onGetScoreboard(socket)
    })

    socket.on('disconnect', () => {
      this.onSocketDisconnect(socket)
    })
  }

  onSocketDisconnect = async (socket: Socket) => {
    this.gameControllers.map(controller => {
      this.onLeaveLobby(socket, controller.roomId)
    })
  }

  onCreateLobby = async (socket: Socket) => {
    const newRoom = new GameController(this.io)
    await newRoom.init()
    this.gameControllers.push(newRoom)

    const state = await newRoom.state

    socket.emit('b2f_lobby', state)
    socket.emit('b2f_gameState', state)

    const activeRooms = await this.getRooms()
    this.io.emit('b2f_gamerooms', activeRooms)
  }

  onJoinLobby = async (socket: Socket, roomId: string) => {
    const lobby = this.gameControllers.find(controller => {
      return controller.roomId == roomId
    })

    if (lobby) {
      await lobby.addPlayer(socket)

      this.io.to(roomId).emit('b2f_lobby', await lobby.state)
      this.io.to(roomId).emit('b2f_gameState', await lobby.state)

      this.io.emit('b2f_gamerooms', await this.getRooms())
    }
  }

  onLeaveLobby = async (socket: Socket, roomId: string) => {

    console.log("leaving...");

    const lobby = this.gameControllers.find(controller => {
      return controller.roomId == roomId
    })
    if (lobby) {
      await lobby.removePlayer(socket)

      if ((await lobby.state).players?.length == 0) {
        const i = this.gameControllers.indexOf(lobby)
        this.gameControllers.splice(i, 1)
        const roomToDelete = await this.manager.findOne(GameRoom, lobby.roomId)
        if (roomToDelete) await this.manager.deleteOne(GameRoom, roomToDelete)
      }
      this.io.emit('b2f_gamerooms', await this.getRooms())
      this.io.to(lobby.roomId).emit('b2f_lobby', await this.getRoom(roomId))
      this.io.to(lobby.roomId).emit('b2f_gameState', await this.getRoom(roomId))
    }
  }

  onStartGame = async (roomId: string) => {
    const lobby = this.gameControllers.find(controller => {
      return controller.roomId == roomId
    })


    if (lobby) {
      await lobby.startGame()
      this.io.emit('b2f_gameRooms', await this.getRooms())
    }
  }

  onRestartGame = async (roomId: string) => {
    const lobby = this.gameControllers.find(controller => {
      return controller.roomId == roomId
    })

    if (lobby) {

      await lobby.restartGame()

      // this.io.emit('b2f_gamerooms', await this.getRooms())
    }
  }

  onGetScoreboard = async (socket: Socket) => {
    const players = (await this.manager.find<User>(User)).sort((a, b) => {
      if (a.highScore > b.highScore) {
        return -1
      } if (a.highScore < b.highScore) {
        return 1
      }
      return 0
    }).slice(0, 10)

    socket.emit('b2f_scoreboard', players)

  };


  getRooms = async () => {
    return (await this.manager.find<GameRoom>(GameRoom)).filter((r) => { return r.players.length < 4 && r.hasEnded == false && r.hasStarted == false })
  }

  getRoom = async (roomId: string) => {
    return this.manager.findOne(GameRoom, roomId)
  }
}
