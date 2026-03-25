// Server-side game state management for multiplayer

function generateGameCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let suffix = ''
  for (let i = 0; i < 4; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)]
  }
  return `ATOM-${suffix}`
}

function calcStabilityMax(massNumber) {
  return massNumber * 3 + 20
}

function calcIdealNeutrons(protonCount) {
  if (protonCount <= 0) return 0
  const ratio = protonCount <= 20 ? 1.0 : 1.0 + (protonCount - 20) * 0.025
  return protonCount * ratio
}

function singleProtonCost(currentProtonCount) {
  return 2 + Math.floor(currentProtonCount / 4)
}

function calcProtonCost(currentProtonCount, protonsToAdd) {
  let total = 0
  for (let i = 0; i < protonsToAdd; i++) {
    total += singleProtonCost(currentProtonCount + i)
  }
  return total
}

function singleNeutronNetChange(protonCount, currentNeutronCount) {
  const ideal = calcIdealNeutrons(protonCount)
  const deficit = ideal - currentNeutronCount
  const baseCost = -1

  if (deficit > 0) {
    const refund = Math.min(deficit, 4) + 1
    return baseCost + refund
  } else if (deficit === 0) {
    return baseCost
  } else {
    const excess = -deficit
    return baseCost - excess
  }
}

function calcNeutronCost(protonCount, currentNeutronCount, neutronsToAdd) {
  let total = 0
  for (let i = 0; i < neutronsToAdd; i++) {
    total += singleNeutronNetChange(protonCount, currentNeutronCount + i)
  }
  return total
}

function resolveCardServer(state, card) {
  let s = { ...state }

  if (card.protonDelta > 0) {
    const cost = calcProtonCost(s.protonCount, card.protonDelta)
    s.stabilityCurrent = Math.max(0, s.stabilityCurrent - cost)
    s.protonCount += card.protonDelta
  } else if (card.protonDelta < 0) {
    s.protonCount = Math.max(0, s.protonCount + card.protonDelta)
  }

  if (card.neutronDelta !== 0) {
    const netChange = calcNeutronCost(s.protonCount, s.neutronCount, card.neutronDelta)
    if (netChange >= 0) {
      s.stabilityCurrent = Math.min(s.stabilityMax, s.stabilityCurrent + netChange)
    } else {
      s.stabilityCurrent = Math.max(0, s.stabilityCurrent + netChange)
    }
    s.neutronCount = Math.max(0, s.neutronCount + card.neutronDelta)
  }

  if (card.electronDelta !== 0) {
    s.electronCount = Math.max(0, s.electronCount + card.electronDelta)
  }

  if (card.specialEffect === 'stabilizer_pulse') {
    s.stabilityCurrent = Math.min(s.stabilityMax, s.stabilityCurrent + 8)
  } else if (card.specialEffect === 'decay_shield') {
    s.decayShieldTurns = (s.decayShieldTurns || 0) + 2
  } else if (card.specialEffect === 'energy_well') {
    s.stabilityMax += 10
    s.stabilityCurrent = Math.min(s.stabilityMax, s.stabilityCurrent + 10)
  }

  s.stabilityCurrentPercent = (s.stabilityCurrent / s.stabilityMax) * 100
  s.turnCount = (s.turnCount || 0) + 1

  // Check win condition
  s.isComplete =
    s.protonCount === s.targetProtons &&
    s.neutronCount === s.targetNeutrons &&
    s.electronCount === s.targetElectrons

  s.isFailed = s.stabilityCurrent <= 0

  return s
}

function createPlayerState(targetProtons, targetNeutrons, targetElectrons) {
  const massNumber = targetProtons + targetNeutrons
  const stabilityMax = calcStabilityMax(massNumber)
  return {
    protonCount: 0,
    neutronCount: 0,
    electronCount: 0,
    stabilityCurrentPercent: 100,
    stabilityMax,
    stabilityCurrent: stabilityMax,
    targetProtons,
    targetNeutrons,
    targetElectrons,
    turnCount: 0,
    decayShieldTurns: 0,
    isComplete: false,
    isFailed: false,
  }
}

// Tier 1 cards for server-side deck generation
const TIER1_CARDS = [
  { id: 't1_single_proton', name: 'Single Proton', tier: 1, protonDelta: 1, neutronDelta: 0, electronDelta: 0, specialEffect: null },
  { id: 't1_proton_pair', name: 'Proton Pair', tier: 1, protonDelta: 2, neutronDelta: 0, electronDelta: 0, specialEffect: null },
  { id: 't1_proton_cluster', name: 'Proton Cluster', tier: 1, protonDelta: 3, neutronDelta: 0, electronDelta: 0, specialEffect: null },
  { id: 't1_single_neutron', name: 'Single Neutron', tier: 1, protonDelta: 0, neutronDelta: 1, electronDelta: 0, specialEffect: null },
  { id: 't1_neutron_pair', name: 'Neutron Pair', tier: 1, protonDelta: 0, neutronDelta: 2, electronDelta: 0, specialEffect: null },
  { id: 't1_neutron_cluster', name: 'Neutron Cluster', tier: 1, protonDelta: 0, neutronDelta: 3, electronDelta: 0, specialEffect: null },
  { id: 't1_single_electron', name: 'Single Electron', tier: 1, protonDelta: 0, neutronDelta: 0, electronDelta: 1, specialEffect: null },
  { id: 't1_electron_pair', name: 'Electron Pair', tier: 1, protonDelta: 0, neutronDelta: 0, electronDelta: 2, specialEffect: null },
  { id: 't1_electron_trio', name: 'Electron Trio', tier: 1, protonDelta: 0, neutronDelta: 0, electronDelta: 3, specialEffect: null },
  { id: 't2_proton_neutron_bundle', name: 'Proton-Neutron Bundle', tier: 2, protonDelta: 2, neutronDelta: 1, electronDelta: 0, specialEffect: null },
  { id: 't2_alpha_bundle', name: 'Alpha Bundle', tier: 2, protonDelta: 2, neutronDelta: 2, electronDelta: 0, specialEffect: null },
  { id: 't2_stabilizer_pulse', name: 'Stabilizer Pulse', tier: 2, protonDelta: 0, neutronDelta: 0, electronDelta: 0, specialEffect: 'stabilizer_pulse' },
  { id: 't2_decay_shield', name: 'Decay Shield', tier: 2, protonDelta: 0, neutronDelta: 0, electronDelta: 0, specialEffect: 'decay_shield' },
  { id: 't2_neutron_burst', name: 'Neutron Burst', tier: 2, protonDelta: 0, neutronDelta: 4, electronDelta: 0, specialEffect: null },
]

function shuffleArray(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function generateMultiplayerHand(playerCount) {
  const handSize = playerCount + 1
  const pool = shuffleArray(TIER1_CARDS)
  const result = []
  for (let i = 0; i < handSize; i++) {
    result.push(pool[i % pool.length])
  }
  return result
}

export class GameServer {
  constructor(io) {
    this.io = io
    this.rooms = new Map() // gameCode → room state

    // Auto-play timers
    this.timers = new Map() // gameCode → timer
  }

  handleConnection(socket) {
    console.log(`Player connected: ${socket.id}`)

    socket.on('create_lobby', ({ playerName }) => {
      this.handleCreateLobby(socket, playerName)
    })

    socket.on('join_lobby', ({ gameCode, playerName }) => {
      this.handleJoinLobby(socket, gameCode, playerName)
    })

    socket.on('start_game', () => {
      this.handleStartGame(socket)
    })

    socket.on('play_card', ({ card }) => {
      this.handlePlayCard(socket, card)
    })

    socket.on('use_companion', () => {
      this.handleUseCompanion(socket)
    })

    socket.on('disconnect', () => {
      this.handleDisconnect(socket)
    })
  }

  handleCreateLobby(socket, playerName) {
    const gameCode = generateGameCode()

    // Make sure code is unique
    let finalCode = gameCode
    let attempts = 0
    while (this.rooms.has(finalCode) && attempts < 10) {
      finalCode = generateGameCode()
      attempts++
    }

    const player = {
      id: socket.id,
      name: playerName || `Player 1`,
      gameState: null,
      isReady: false,
      currentCard: null,
    }

    const room = {
      gameCode: finalCode,
      players: [player],
      hostId: socket.id,
      isStarted: false,
      round: 0,
      target: null,
    }

    this.rooms.set(finalCode, room)
    socket.join(finalCode)
    socket.data.gameCode = finalCode
    socket.data.playerId = socket.id

    this.broadcastLobbyUpdate(finalCode)
    console.log(`Lobby created: ${finalCode} by ${playerName}`)
  }

  handleJoinLobby(socket, gameCode, playerName) {
    const room = this.rooms.get(gameCode)
    if (!room) {
      socket.emit('game_error', `Game code ${gameCode} not found.`)
      return
    }
    if (room.isStarted) {
      socket.emit('game_error', 'Game has already started.')
      return
    }
    if (room.players.length >= 4) {
      socket.emit('game_error', 'Lobby is full (max 4 players).')
      return
    }

    const player = {
      id: socket.id,
      name: playerName || `Player ${room.players.length + 1}`,
      gameState: null,
      isReady: false,
      currentCard: null,
    }

    room.players.push(player)
    socket.join(gameCode)
    socket.data.gameCode = gameCode
    socket.data.playerId = socket.id

    this.broadcastLobbyUpdate(gameCode)
    console.log(`${playerName} joined ${gameCode}`)
  }

  handleStartGame(socket) {
    const gameCode = socket.data.gameCode
    const room = this.rooms.get(gameCode)
    if (!room) return
    if (room.hostId !== socket.id) {
      socket.emit('game_error', 'Only the host can start the game.')
      return
    }
    if (room.players.length < 2) {
      socket.emit('game_error', 'Need at least 2 players to start.')
      return
    }

    // Pick a random target element (Carbon for simplicity in first round)
    const TARGET_PROTONS = 6
    const TARGET_NEUTRONS = 6
    const TARGET_ELECTRONS = 6

    room.isStarted = true
    room.target = { protons: TARGET_PROTONS, neutrons: TARGET_NEUTRONS, electrons: TARGET_ELECTRONS }

    // Initialize game state for each player
    for (const player of room.players) {
      player.gameState = createPlayerState(TARGET_PROTONS, TARGET_NEUTRONS, TARGET_ELECTRONS)
      player.currentCard = null
      player.isReady = false
    }

    // Deal initial hands
    this.dealHands(room)

    this.io.to(gameCode).emit('game_started', {
      target: room.target,
      players: room.players.map(p => ({
        id: p.id,
        name: p.name,
        gameState: p.gameState,
      })),
    })

    // Start turn timer
    this.startTurnTimer(gameCode)
    this.broadcastGameState(gameCode)
  }

  dealHands(room) {
    const handSize = room.players.length + 1
    for (const player of room.players) {
      player.hand = generateMultiplayerHand(room.players.length)
    }
  }

  handlePlayCard(socket, card) {
    const gameCode = socket.data.gameCode
    const room = this.rooms.get(gameCode)
    if (!room || !room.isStarted) return

    const player = room.players.find(p => p.id === socket.id)
    if (!player || !player.gameState) return
    if (player.currentCard) return // Already played this turn

    player.currentCard = card
    player.isReady = true

    // Check if all players have played
    if (room.players.every(p => p.isReady)) {
      this.resolveTurn(room)
    }

    this.broadcastGameState(gameCode)
  }

  handleUseCompanion(socket) {
    const gameCode = socket.data.gameCode
    const room = this.rooms.get(gameCode)
    if (!room || !room.isStarted) return

    const player = room.players.find(p => p.id === socket.id)
    if (!player?.gameState) return

    // Companion donates 1 electron (simplified server-side companion)
    if (player.gameState.electronCount < player.gameState.targetElectrons) {
      player.gameState.electronCount += 1
      player.gameState.stabilityCurrent = Math.max(0, player.gameState.stabilityCurrent - 3)
      player.gameState.stabilityCurrentPercent = (player.gameState.stabilityCurrent / player.gameState.stabilityMax) * 100
    }

    this.broadcastGameState(gameCode)
  }

  resolveTurn(room) {
    // Clear turn timer
    if (this.timers.has(room.gameCode)) {
      clearTimeout(this.timers.get(room.gameCode))
      this.timers.delete(room.gameCode)
    }

    // Resolve each player's own card
    for (const player of room.players) {
      if (player.currentCard && player.gameState) {
        player.gameState = resolveCardServer(player.gameState, player.currentCard)
      }
    }

    // Resolve interference cards (tier 5) against opponents
    for (const player of room.players) {
      if (player.currentCard?.isInterference) {
        this.resolveInterference(room, player)
      }
    }

    // Check win/lose conditions
    const completedPlayers = room.players.filter(p => p.gameState?.isComplete)
    const failedPlayers = room.players.filter(p => p.gameState?.isFailed)

    if (completedPlayers.length > 0 || failedPlayers.length > 0) {
      this.io.to(room.gameCode).emit('round_end', {
        completed: completedPlayers.map(p => p.id),
        failed: failedPlayers.map(p => p.id),
        players: room.players.map(p => ({
          id: p.id,
          name: p.name,
          gameState: p.gameState,
        })),
      })
      return
    }

    // Pass cards (7 Wonders style) and reset for next turn
    this.passCards(room)

    // Reset ready states
    for (const player of room.players) {
      player.currentCard = null
      player.isReady = false
    }

    this.broadcastGameState(room.gameCode)
    this.startTurnTimer(room.gameCode)
  }

  passCards(room) {
    // Rotate hands clockwise
    const firstHand = room.players[0].hand
    for (let i = 0; i < room.players.length - 1; i++) {
      room.players[i].hand = room.players[i + 1].hand
    }
    room.players[room.players.length - 1].hand = firstHand

    // If hands are exhausted, deal new ones
    const anyEmpty = room.players.some(p => !p.hand || p.hand.length === 0)
    if (anyEmpty) {
      this.dealHands(room)
    }
  }

  resolveInterference(room, attacker) {
    const targets = room.players.filter(p => p.id !== attacker.id)
    if (targets.length === 0) return

    const target = targets[Math.floor(Math.random() * targets.length)]
    if (!target.gameState) return

    const effect = attacker.currentCard?.specialEffect

    if (effect === 'photon_blast') {
      // Eject outermost electron
      if (target.gameState.electronCount > 0) {
        target.gameState.electronCount -= 1
      }
    } else if (effect === 'gamma_ray') {
      target.gameState.gammaRayTurns = (target.gameState.gammaRayTurns || 0) + 2
    } else if (effect === 'electron_thief') {
      if (target.gameState.electronCount > 0) {
        target.gameState.electronCount -= 1
        attacker.gameState.electronCount += 1
      }
    } else if (effect === 'shielding_collapse') {
      const penalty = Math.floor(target.gameState.electronCount / 2)
      target.gameState.stabilityCurrent = Math.max(0, target.gameState.stabilityCurrent - penalty)
      target.gameState.stabilityCurrentPercent = (target.gameState.stabilityCurrent / target.gameState.stabilityMax) * 100
    }
  }

  startTurnTimer(gameCode) {
    const TURN_TIMEOUT_MS = 25000 // 25 seconds

    const timer = setTimeout(() => {
      const room = this.rooms.get(gameCode)
      if (!room) return

      // Auto-play a random card for any player who hasn't played
      for (const player of room.players) {
        if (!player.isReady && player.hand && player.hand.length > 0) {
          player.currentCard = player.hand[0]
          player.isReady = true
        }
      }

      this.resolveTurn(room)
    }, TURN_TIMEOUT_MS)

    this.timers.set(gameCode, timer)
  }

  handleDisconnect(socket) {
    const gameCode = socket.data.gameCode
    if (!gameCode) return

    const room = this.rooms.get(gameCode)
    if (!room) return

    room.players = room.players.filter(p => p.id !== socket.id)
    console.log(`Player ${socket.id} disconnected from ${gameCode}`)

    if (room.players.length === 0) {
      // Clean up empty room
      this.rooms.delete(gameCode)
      if (this.timers.has(gameCode)) {
        clearTimeout(this.timers.get(gameCode))
        this.timers.delete(gameCode)
      }
    } else {
      // Reassign host if needed
      if (room.hostId === socket.id) {
        room.hostId = room.players[0].id
      }
      this.broadcastLobbyUpdate(gameCode)
    }
  }

  broadcastLobbyUpdate(gameCode) {
    const room = this.rooms.get(gameCode)
    if (!room) return

    this.io.to(gameCode).emit('lobby_update', {
      gameCode: room.gameCode,
      players: room.players.map(p => ({
        id: p.id,
        name: p.name,
        isReady: p.isReady,
        currentCard: null, // Don't reveal choices
      })),
      hostId: room.hostId,
      isStarted: room.isStarted,
    })
  }

  broadcastGameState(gameCode) {
    const room = this.rooms.get(gameCode)
    if (!room) return

    const stateMap = {}
    for (const player of room.players) {
      stateMap[player.id] = player.gameState
    }

    this.io.to(gameCode).emit('game_state_update', stateMap)
  }
}
