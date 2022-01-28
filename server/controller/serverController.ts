import { DecodedIdToken } from 'firebase-admin/lib/auth/token-verifier'
import { Server, Socket } from 'socket.io'
import { getMongoManager, MongoEntityManager } from 'typeorm'
import { GameRoom } from '../entities/GameRoom'
import { User } from '../entities/User'
import { SocketMessages } from '../interfaces/socketMessages'
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

    await Promise.all(sessions.map(async (room) => {
      await this.manager.delete<GameRoom>(GameRoom, room.roomId)
    }))
  }

  enableListeners = () => {
    this.io.on('connection', this.newConnection)
  }

  newConnection = async (socket: Socket) => {
    const activeRooms = await this.getRooms()

    this.enableSocketListeners(socket)

    socket.emit(SocketMessages.activeRooms, activeRooms)
  }

  enableSocketListeners = (socket: Socket) => {
    socket.on(SocketMessages.newLobby, () => {
      this.onCreateLobby(socket)
    })

    socket.on(SocketMessages.joinLobby, (lobbyId: string) => {
      this.onJoinLobby(socket, lobbyId)
    })

    socket.on(SocketMessages.leaveLobby, (lobbyId: string) => {
      this.onLeaveLobby(socket, lobbyId)
    })

    socket.on(SocketMessages.startGame, (lobbyId: string) => {
      this.onStartGame(lobbyId)
    })

    socket.on(SocketMessages.restartGame, (lobbyId: string) => {

      this.onRestartGame(lobbyId)
    }
    )

    socket.on(SocketMessages.getScoreboard, () => {
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
    try {
      const newRoom = new GameController(this.io)
      const state = await newRoom.init()

      this.gameControllers.push(newRoom)

      socket.emit(SocketMessages.lobbyInfo, state)
      socket.emit(SocketMessages.gameState, state)

      const activeRooms = await this.getRooms()
      this.io.emit(SocketMessages.activeRooms, activeRooms)
    } catch (error) {
      console.log("Something went wrong while creating a lobby: " + error);

    }

  }

  onJoinLobby = async (socket: Socket, roomId: string) => {
    try {
      const lobby = this.gameControllers.find(controller => {
        return controller.roomId == roomId
      })

      if (lobby) {
        await lobby.addPlayer(socket)

        this.io.to(roomId).emit(SocketMessages.lobbyInfo, await lobby.state)
        this.io.to(roomId).emit(SocketMessages.gameState, await lobby.state)

        this.io.emit(SocketMessages.activeRooms, await this.getRooms())
      }
    } catch (error) {
      console.log("Something went wrong while joining a lobby: " + error);

    }

  }

  onLeaveLobby = async (socket: Socket, roomId: string) => {

    try {
      console.log("leaving lobby...");

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
        this.io.emit(SocketMessages.activeRooms, await this.getRooms())
        this.io.to(lobby.roomId).emit(SocketMessages.lobbyInfo, await this.getRoom(roomId))
        this.io.to(lobby.roomId).emit(SocketMessages.gameState, await this.getRoom(roomId))
      }
    } catch (error) {

      console.log("Something went wrong while removing a player: " + error);

    }

  }

  onStartGame = async (roomId: string) => {
    try {
      const lobby = this.gameControllers.find(controller => {
        return controller.roomId == roomId
      })


      if (lobby) {
        await lobby.startGame()
        this.io.emit(SocketMessages.activeRooms, await this.getRooms())
      }
    } catch (error) {
      console.log("Something went wrong while starting a game: " + error);
    }

  }

  onRestartGame = async (roomId: string) => {
    try {
      const lobby = this.gameControllers.find(controller => {
        return controller.roomId == roomId
      })

      if (lobby) {

        await lobby.restartGame()

      }
    } catch (error) {
      console.log("Something went wrong while restarting a game: " + error);
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

    socket.emit(SocketMessages.scoreboard, players)
  };


  getRooms = async () => {
    return (await this.manager.find<GameRoom>(GameRoom)).filter((r) => { return r.players.length < 4 && r.hasEnded == false && r.hasStarted == false })
  }

  getRoom = async (roomId: string) => {
    return this.manager.findOne(GameRoom, roomId)
  }
}
