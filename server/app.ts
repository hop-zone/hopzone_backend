import express, { Request, Response } from 'express'
import dotenv from 'dotenv'
import "reflect-metadata"

import credential from './auth/application-credentials.json'
import admin, { auth } from 'firebase-admin'
import { initializeApp, ServiceAccount } from 'firebase-admin/app'
import { createServer } from "http"
import { MongoConnectionOptions } from 'typeorm/driver/mongodb/MongoConnectionOptions'
import { createConnection } from 'typeorm'
import { Server } from 'socket.io'
import authMiddleware from './auth/firebaseAuthMiddleware'
import { ServerController } from './controller/serverController'

// APP SETUP
dotenv.config()
initializeApp({
  credential: admin.credential.cert(credential as ServiceAccount)
})

const app = express(),
  port = process.env.PORT || 3001


  // MIDDLEWARE

  ; (async () => {
    const conn: MongoConnectionOptions = {
      name: 'mongodb',
      type: 'mongodb',
      url: `mongodb://root:example@127.0.0.1:27017/`,
      useNewUrlParser: true,
      synchronize: true,
      logging: true,
      useUnifiedTopology: true,
      entities: [`${__dirname}/entities/**/*{.ts,.js}`],
    }



    await createConnection(conn)
      .then((connection) => {
        console.log("Successfully connected to the database");
        console.log("Starting Socket.io server...");

        const httpServer = createServer(app)
        const io = new Server(httpServer, { cors: { origin: '*', methods: ['GET', 'POST'] } })

        io.use(authMiddleware)


        const socketServer = new ServerController(io)


        socketServer.enableListeners()

        httpServer.listen(port, () => {
          console.info('The socket IO server is listening')
        })


      })
      .catch(ex => console.log(ex))


  })()

