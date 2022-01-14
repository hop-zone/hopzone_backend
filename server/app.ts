import express, { Request, Response } from 'express'
import dotenv from 'dotenv'
import "reflect-metadata"

import credential from './auth/application-credentials.json'
import admin, { auth } from 'firebase-admin'
import { initializeApp, ServiceAccount } from 'firebase-admin/app'
import { createServer } from "http"
import authMiddleware from './auth/firebaseAuthMiddleware'
import { Server, Socket } from 'socket.io'
import { SocketController } from './controller/socketController'
import { GameController } from './controller/gameController'
import { GameRoom } from './models/GameRoom'
import { DecodedIdToken } from 'firebase-admin/lib/auth/token-verifier'
import { MongoConnectionOptions } from 'typeorm/driver/mongodb/MongoConnectionOptions'
import { createConnection } from 'typeorm'

// APP SETUP
dotenv.config()
initializeApp({
  credential: admin.credential.cert(credential as ServiceAccount)
})

;(async () => {
  const conn: MongoConnectionOptions = {
    name: 'mongodb',
    type: 'mongodb',
    url: `mongodb://root:example@127.0.0.1:27017/`,
    useNewUrlParser: true,
    synchronize: true,
    logging: true,
    useUnifiedTopology: true,
    entities: [`${__dirname}/entity/*{.ts,.js}`],
  }

  

  await createConnection(conn)
    .then((e) => {
      console.log("success");
      
    })
    .catch(ex => console.log(ex))
})()

const gameRooms: GameController[] = []
const activeRooms = []

const port = process.env.PORT || 3001
const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, { cors: { origin: '*', methods: ['GET', 'POST'] } })


io.use(authMiddleware)

io.on("connection", (socket) => {
  io.emit('b2f_gamerooms', getRooms())

  socket.on('f2b_newLobby', () => {
    const hostName = ((socket.request as any).currentUser as DecodedIdToken).name
    const newRoom = new GameController(io, Date.now(), hostName)
    gameRooms.push(newRoom)

    socket.emit('b2f_lobby', newRoom.getGameState())
    io.emit('b2f_gamerooms', getRooms())
  })

  socket.on('f2b_joinLobby', (data: number) => {
    const lobby = gameRooms.find((r) => { return r.roomId == data })
    
    if (lobby) {
      lobby.addPlayer(socket).then(() => {
        io.to(lobby.roomId.toString()).emit('b2f_lobby', lobby.getGameState())
        io.emit('b2f_gamerooms', getRooms())
      })
    }
  })

  socket.on('f2b_leaveLobby', (lobbyId: number) => {
    const lobby = gameRooms.find((r) => { return r.roomId == lobbyId })
    if (lobby) {

      lobby.removePlayer(socket)

      if (lobby.sockets.length == 0) {
        const i = gameRooms.indexOf(lobby)
        gameRooms.splice(i, 1)
        io.emit('b2f_gamerooms', getRooms())
      }

      io.to(lobby.roomId.toString()).emit('b2f_lobby', lobby.getGameState())
    }
  })

  // socket.on('disconnect', () => {
    
  // })

})


const getRooms = (): GameRoom[] => {
  return gameRooms.map((r) => {
    return r.getGameState()
  })
}

httpServer.listen(port, () => {
  console.info('The socket IO server is listening!')
})
