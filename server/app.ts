import express, { Request, Response } from 'express'
import dotenv from 'dotenv'

import credential from './auth/application-credentials.json'
import admin, { auth } from 'firebase-admin'
import { initializeApp, ServiceAccount } from 'firebase-admin/app'
import authMiddleware from './auth/firebaseAuthMiddleware'

// APP SETUP
dotenv.config()
initializeApp({
  credential: admin.credential.cert(credential as ServiceAccount)
})


const app = express(),
  port = process.env.PORT || 3001

// MIDDLEWARE
app.use(express.json()) // for parsing application/json
app.use(authMiddleware)

// ROUTES
app.get('/', (request: Request, response: Response) => {
  response.send(`Welcome, just know: you matter!`)
})

// APP START
app.listen(port, () => {
  console.info(`\nServer 👾 \nListening on http://localhost:${port}/`)
})