import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import type { GameState, Card, MultiplayerPlayer } from '../types/game'

const SERVER_URL = 'http://localhost:3001'

export interface LobbyState {
  gameCode: string
  players: MultiplayerPlayer[]
  hostId: string
  isStarted: boolean
}

export function useSocket() {
  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [lobbyState, setLobbyState] = useState<LobbyState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null)

  useEffect(() => {
    const socket = io(SERVER_URL, {
      autoConnect: false,
      transports: ['websocket'],
    })

    socketRef.current = socket

    socket.on('connect', () => {
      setIsConnected(true)
      setMyPlayerId(socket.id ?? null)
      setError(null)
    })

    socket.on('disconnect', () => {
      setIsConnected(false)
    })

    socket.on('connect_error', (err: Error) => {
      setError(`Connection failed: ${err.message}`)
      setIsConnected(false)
    })

    socket.on('lobby_update', (state: LobbyState) => {
      setLobbyState(state)
    })

    socket.on('game_error', (msg: string) => {
      setError(msg)
    })

    socket.connect()

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [])

  const createLobby = useCallback((playerName: string) => {
    socketRef.current?.emit('create_lobby', { playerName })
  }, [])

  const joinLobby = useCallback((gameCode: string, playerName: string) => {
    socketRef.current?.emit('join_lobby', { gameCode, playerName })
  }, [])

  const startGame = useCallback(() => {
    socketRef.current?.emit('start_game')
  }, [])

  const playCard = useCallback((card: Card) => {
    socketRef.current?.emit('play_card', { card })
  }, [])

  const useCompanion = useCallback(() => {
    socketRef.current?.emit('use_companion')
  }, [])

  const onGameStateUpdate = useCallback((handler: (states: Record<string, GameState>) => void) => {
    socketRef.current?.on('game_state_update', handler)
    return () => {
      socketRef.current?.off('game_state_update', handler)
    }
  }, [])

  const onDecayEvent = useCallback((handler: (data: { playerId: string; event: string }) => void) => {
    socketRef.current?.on('decay_event', handler)
    return () => {
      socketRef.current?.off('decay_event', handler)
    }
  }, [])

  return {
    isConnected,
    lobbyState,
    myPlayerId,
    error,
    createLobby,
    joinLobby,
    startGame,
    playCard,
    useCompanion,
    onGameStateUpdate,
    onDecayEvent,
  }
}
