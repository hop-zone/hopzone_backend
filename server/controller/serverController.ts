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
    try {
      const newRoom = new GameController(this.io)
      const state = await newRoom.init()

      this.gameControllers.push(newRoom)



      console.log(state);

      socket.emit('b2f_lobby', state)
      socket.emit('b2f_gameState', state)

      const activeRooms = await this.getRooms()
      this.io.emit('b2f_gamerooms', activeRooms)
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

        this.io.to(roomId).emit('b2f_lobby', await lobby.state)
        this.io.to(roomId).emit('b2f_gameState', await lobby.state)

        this.io.emit('b2f_gamerooms', await this.getRooms())
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
        this.io.emit('b2f_gamerooms', await this.getRooms())
        this.io.to(lobby.roomId).emit('b2f_lobby', await this.getRoom(roomId))
        this.io.to(lobby.roomId).emit('b2f_gameState', await this.getRoom(roomId))
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
        this.io.emit('b2f_gameRooms', await this.getRooms())
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

    socket.emit('b2f_scoreboard', players)
  };


  getRooms = async () => {
    return (await this.manager.find<GameRoom>(GameRoom)).filter((r) => { return r.players.length < 4 && r.hasEnded == false && r.hasStarted == false })
  }

  getRoom = async (roomId: string) => {
    return this.manager.findOne(GameRoom, roomId)
  }
}
