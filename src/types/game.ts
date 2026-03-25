export interface Element {
  symbol: string
  name: string
  atomicNumber: number
  standardNeutrons: number
  period: number
  group: number
  category: string
}

export interface Subshell {
  name: string
  maxElectrons: number
  currentElectrons: number
}

export interface OrbitalShell {
  shellNumber: number
  subshells: Subshell[]
}

export interface CompanionAtom {
  elementSymbol: string
  charge: number
  usesRemaining: number
  usesTotal: number
}

export type DecayEvent =
  | 'stable'
  | 'beta_decay'
  | 'neutron_emission'
  | 'electron_ejection'
  | 'double_decay'

export type GameMode = 'tutorial' | 'free_play' | 'daily' | 'multiplayer'

export type StarRating = 0 | 1 | 2 | 3

export type CardType =
  | 'proton'
  | 'neutron'
  | 'electron'
  | 'bundle'
  | 'utility'
  | 'interference'
  | 'wild'

export type SpecialEffect =
  | 'stabilizer_pulse'
  | 'decay_shield'
  | 'beta_conversion'
  | 'neutron_capture'
  | 'isotope_shift'
  | 'companion_call'
  | 'nuclear_resonance'
  | 'fission_gambit'
  | 'quantum_tunneling'
  | 'photon_blast'
  | 'gamma_ray'
  | 'electron_thief'
  | 'shielding_collapse'
  | 'magnetic_reversal'
  | 'mystery_particle'
  | 'antimatter_pulse'
  | 'energy_well'
  | 'half_life_timer'
  | null

export interface Card {
  id: string
  name: string
  tier: 1 | 2 | 3 | 4 | 5 | 0
  description: string
  type: CardType
  protonDelta: number
  neutronDelta: number
  electronDelta: number
  specialEffect: SpecialEffect
  isInterference: boolean
  stabilityDelta?: number
}

export interface GameState {
  protonCount: number
  neutronCount: number
  electronCount: number
  electronConfig: OrbitalShell[]
  stabilityCurrentPercent: number
  stabilityMax: number
  stabilityCurrent: number
  companionType: 'metal' | 'nonmetal' | null
  companionCharge: number
  companionUsesRemaining: number
  turnCount: number
  cardsRemaining: number
  decayShieldTurns: number
  nuclearResonanceActive: boolean
  targetProtons: number
  targetNeutrons: number
  targetElectrons: number
  currentElement: Element | null
  gameMode: GameMode
  isComplete: boolean
  isFailed: boolean
  hand: Card[]
  deck: Card[]
  lastDecayEvent: DecayEvent | null
  lastMessage: string
  starRating: StarRating
  halfLifeCountdown: number
  gammaRayTurns: number
}

export interface LevelConfig {
  element: Element
  targetProtons: number
  targetNeutrons: number
  targetElectrons: number
  turnLimit: number
  stabilityThreshold: number
  deck: Card[]
  companionOptions: CompanionAtom[]
  tutorialPrompts: string[]
}

export interface MultiplayerPlayer {
  id: string
  name: string
  gameState: GameState
  isReady: boolean
  currentCard: Card | null
}

export interface LobbyState {
  gameCode: string
  players: MultiplayerPlayer[]
  hostId: string
  isStarted: boolean
  round: number
}
