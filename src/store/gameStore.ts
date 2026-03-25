import { create } from 'zustand'
import type { GameState, Card, LevelConfig, GameMode } from '../types/game'
import {
  resolveCard,
  performDecayCheck,
  calcStarRating,
} from '../game/gameEngine'
import {
  buildInitialElectronConfig,
  addElectrons,
  removeLastElectron,
  getElectronCount,
} from '../game/electronConfig'
import { replaceCardInHand, buildFreeDeck } from '../game/deckBuilder'
import { ELEMENTS } from '../data/elements'

interface GameStore {
  gameState: GameState | null
  currentLevelConfig: LevelConfig | null
  isDecayModalOpen: boolean
  tutorialPromptIndex: number

  initLevel: (config: LevelConfig) => void
  initFreePlay: (elementSymbol: string, maxTier?: number) => void
  playCard: (cardIndex: number) => void
  useCompanion: () => void
  discardCard: (cardIndex: number) => void
  revealDecayModal: () => void
  hideDecayModal: () => void
  advanceTutorialPrompt: () => void
  resetGame: () => void
  setGameMode: (mode: GameMode) => void
}

function buildInitialState(
  targetProtons: number,
  targetNeutrons: number,
  targetElectrons: number,
  gameMode: GameMode,
  deck: Card[],
  elementSymbol?: string
): GameState {
  const element = elementSymbol ? ELEMENTS.find(e => e.symbol === elementSymbol) ?? null : null
  const massNumber = targetProtons + targetNeutrons
  const stabilityMax = massNumber * 3 + 20
  const hand = deck.slice(0, 3)
  const remaining = deck.slice(3)

  return {
    protonCount: 0,
    neutronCount: 0,
    electronCount: 0,
    electronConfig: buildInitialElectronConfig(),
    stabilityCurrentPercent: 100,
    stabilityMax,
    stabilityCurrent: stabilityMax,
    companionType: null,
    companionCharge: 0,
    companionUsesRemaining: 0,
    turnCount: 0,
    cardsRemaining: deck.length,
    decayShieldTurns: 0,
    nuclearResonanceActive: false,
    targetProtons,
    targetNeutrons,
    targetElectrons,
    currentElement: element,
    gameMode,
    isComplete: false,
    isFailed: false,
    hand,
    deck: remaining,
    lastDecayEvent: null,
    lastMessage: element
      ? `Build ${element.name}! Target: ${targetProtons}p / ${targetNeutrons}n / ${targetElectrons}e`
      : 'Build the target atom!',
    starRating: 0,
    halfLifeCountdown: 0,
    gammaRayTurns: 0,
  }
}

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: null,
  currentLevelConfig: null,
  isDecayModalOpen: false,
  tutorialPromptIndex: 0,

  initLevel: (config: LevelConfig) => {
    const state = buildInitialState(
      config.targetProtons,
      config.targetNeutrons,
      config.targetElectrons,
      'tutorial',
      config.deck,
      config.element.symbol
    )

    // Apply companion from config
    const stateWithCompanion: GameState = config.companionOptions.length > 0
      ? {
          ...state,
          currentElement: config.element,
          companionType: config.companionOptions[0].charge > 0 ? 'metal' : 'nonmetal',
          companionCharge: config.companionOptions[0].charge,
          companionUsesRemaining: config.companionOptions[0].usesRemaining,
        }
      : { ...state, currentElement: config.element }

    set({
      gameState: stateWithCompanion,
      currentLevelConfig: config,
      isDecayModalOpen: false,
      tutorialPromptIndex: 0,
    })
  },

  initFreePlay: (elementSymbol: string, maxTier = 2) => {
    const element = ELEMENTS.find(e => e.symbol === elementSymbol)
    if (!element) return

    const deck = buildFreeDeck(maxTier)
    const state = buildInitialState(
      element.atomicNumber,
      element.standardNeutrons,
      element.atomicNumber,
      'free_play',
      deck,
      elementSymbol
    )

    set({
      gameState: state,
      currentLevelConfig: null,
      isDecayModalOpen: false,
      tutorialPromptIndex: 0,
    })
  },

  playCard: (cardIndex: number) => {
    const { gameState, currentLevelConfig } = get()
    if (!gameState || gameState.isComplete || gameState.isFailed) return
    if (cardIndex < 0 || cardIndex >= gameState.hand.length) return

    // Resolve the card
    let newState = resolveCard(gameState, gameState.hand[cardIndex])

    // Replace played card with next from deck
    const { newHand, newDeck } = replaceCardInHand(gameState.hand, cardIndex, gameState.deck)
    newState = {
      ...newState,
      hand: newHand,
      deck: newDeck,
      cardsRemaining: newDeck.length + newHand.length,
    }

    // Determine if decay modal should show
    const needsDecayModal =
      newState.stabilityCurrentPercent < 50 &&
      newState.decayShieldTurns <= 0 &&
      !newState.isComplete &&
      !newState.isFailed

    // Calculate star rating if complete
    if (newState.isComplete && currentLevelConfig) {
      newState = {
        ...newState,
        starRating: calcStarRating(
          newState,
          currentLevelConfig.turnLimit,
          currentLevelConfig.stabilityThreshold
        ),
      }
    }

    set({ gameState: newState, isDecayModalOpen: needsDecayModal })
  },

  useCompanion: () => {
    const { gameState } = get()
    if (!gameState) return
    if (gameState.companionUsesRemaining <= 0) return
    if (gameState.isComplete || gameState.isFailed) return

    let newState = { ...gameState }
    const companionCharge = Math.abs(newState.companionCharge)
    const atomicNumber = newState.currentElement?.atomicNumber

    if (newState.companionType === 'metal') {
      // Metal donates electrons to atom
      const { newConfig } = addElectrons(newState.electronConfig, companionCharge, atomicNumber)
      newState = {
        ...newState,
        electronConfig: newConfig,
        electronCount: getElectronCount(newConfig),
      }
    } else if (newState.companionType === 'nonmetal') {
      // Nonmetal accepts electrons from atom
      let config = newState.electronConfig
      const removeCount = Math.min(companionCharge, newState.electronCount)
      for (let i = 0; i < removeCount; i++) {
        config = removeLastElectron(config)
      }
      newState = {
        ...newState,
        electronConfig: config,
        electronCount: getElectronCount(config),
      }
    }

    // Companion use costs 3 stability
    newState = {
      ...newState,
      stabilityCurrent: Math.max(0, newState.stabilityCurrent - 3),
      companionUsesRemaining: newState.companionUsesRemaining - 1,
      lastMessage: `Companion ${newState.companionType === 'metal' ? 'donated' : 'accepted'} ${companionCharge} electron(s).`,
    }
    newState = {
      ...newState,
      stabilityCurrentPercent: (newState.stabilityCurrent / newState.stabilityMax) * 100,
    }

    set({ gameState: newState })
  },

  discardCard: (cardIndex: number) => {
    const { gameState } = get()
    if (!gameState) return
    if (cardIndex < 0 || cardIndex >= gameState.hand.length) return

    const discardCost = Math.floor(gameState.stabilityMax * 0.05)
    const newStability = Math.max(0, gameState.stabilityCurrent - discardCost)

    const { newHand, newDeck } = replaceCardInHand(gameState.hand, cardIndex, gameState.deck)

    set({
      gameState: {
        ...gameState,
        stabilityCurrent: newStability,
        stabilityCurrentPercent: (newStability / gameState.stabilityMax) * 100,
        hand: newHand,
        deck: newDeck,
        cardsRemaining: newDeck.length + newHand.length,
        lastMessage: "Card discarded. Sometimes the best move is to cut your losses.",
      },
    })
  },

  revealDecayModal: () => {
    set({ isDecayModalOpen: true })
  },

  hideDecayModal: () => {
    const { gameState } = get()
    if (!gameState) {
      set({ isDecayModalOpen: false })
      return
    }

    const { event, newState } = performDecayCheck(gameState)
    set({
      gameState: { ...newState, lastDecayEvent: event },
      isDecayModalOpen: false,
    })
  },

  advanceTutorialPrompt: () => {
    const { tutorialPromptIndex, currentLevelConfig } = get()
    const max = (currentLevelConfig?.tutorialPrompts.length ?? 1) - 1
    set({ tutorialPromptIndex: Math.min(tutorialPromptIndex + 1, max) })
  },

  resetGame: () => {
    set({
      gameState: null,
      currentLevelConfig: null,
      isDecayModalOpen: false,
      tutorialPromptIndex: 0,
    })
  },

  setGameMode: (mode: GameMode) => {
    const { gameState } = get()
    if (gameState) {
      set({ gameState: { ...gameState, gameMode: mode } })
    }
  },
}))
