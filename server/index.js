import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { GameServer } from './gameServer.js'

const app = express()
const httpServer = createServer(app)

const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})

const gameServer = new GameServer(io)

io.on('connection', socket => {
  gameServer.handleConnection(socket)
})

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', rooms: gameServer.rooms.size })
})

const PORT = process.env.PORT ?? 3001

httpServer.listen(PORT, () => {
  console.log(`An Atomy server running on port ${PORT}`)
})
