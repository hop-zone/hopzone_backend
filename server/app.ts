import express, { Request, Response } from 'express'
import dotenv from 'dotenv'

import credential from './auth/application-credentials.json'
import admin, { auth } from 'firebase-admin'
import { initializeApp, ServiceAccount } from 'firebase-admin/app'
import { createServer } from "http"
import authMiddleware from './auth/firebaseAuthMiddleware'
import { Server, Socket } from 'socket.io'
import { SocketController } from './controller/socketController'

// APP SETUP
dotenv.config()
initializeApp({
  credential: admin.credential.cert(credential as ServiceAccount)
})


const port = process.env.PORT || 3001
const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, { cors: { origin: '*', methods: ['GET', 'POST'] } })


// io.use((socket, next) => {
//   console.log(socket.request.headers.authorization);
  
// })
io.use(authMiddleware)

io.on("connection", (socket) => {
  const controller = new SocketController(io, socket)

  console.log("new client");
  
  socket.emit('b2f_connection', 'Successfully connected')
  socket.on('f2b_newLobby', controller.createLobby)

})

httpServer.listen(port, () => {
  console.info('The socket IO server is listening!')
})

// const app = express(),
//   port = process.env.PORT || 3001

// // MIDDLEWARE
// app.use(express.json()) // for parsing application/json
// app.use(authMiddleware)

// // ROUTES
// app.get('/', (request: Request, response: Response) => {
//   response.send(`Welcome, just know: you matter!`)
// })

// // APP START
// app.listen(port, () => {
//   console.info(`\nServer 👾 \nListening on http://localhost:${port}/`)
// })