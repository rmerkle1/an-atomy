import type { GameState, Card, OrbitalShell, DecayEvent } from '../types/game'
import {
  addElectrons,
  buildInitialElectronConfig,
  checkSubshellCompletionBonus,
  getElectronCount,
  removeLastElectron,
} from './electronConfig'

// ── Stability Pool Sizing ─────────────────────────────────────────────────────

export function calcStabilityMax(targetMassNumber: number, tightBudget = false): number {
  if (tightBudget) {
    return targetMassNumber * 2 + 10
  }
  return targetMassNumber * 3 + 20
}

// ── Proton Cost ───────────────────────────────────────────────────────────────

// Cost to add one proton when currentProtonCount protons are already present
function singleProtonCost(currentProtonCount: number): number {
  return 2 + Math.floor(currentProtonCount / 4)
}

export function calcProtonCost(currentProtonCount: number, protonsToAdd: number): number {
  let total = 0
  for (let i = 0; i < protonsToAdd; i++) {
    total += singleProtonCost(currentProtonCount + i)
  }
  return total
}

// ── Ideal Neutron Ratio ────────────────────────────────────────────────────────

export function calcIdealNeutrons(protonCount: number): number {
  if (protonCount <= 0) return 0
  const ratio = protonCount <= 20 ? 1.0 : 1.0 + (protonCount - 20) * 0.025
  return protonCount * ratio
}

// ── Neutron Cost / Refund ──────────────────────────────────────────────────────

// Returns the net stability change for adding a single neutron
// (positive = gain, negative = loss)
function singleNeutronNetChange(
  protonCount: number,
  currentNeutronCount: number
): number {
  const ideal = calcIdealNeutrons(protonCount)
  const deficit = ideal - currentNeutronCount // positive = need more neutrons

  const baseCost = -1 // always pay 1

  if (deficit > 0) {
    // Need more neutrons — refund scales with deficit
    const refund = Math.min(deficit, 4) + 1
    return baseCost + refund // net positive when deficit >= 1
  } else if (deficit === 0) {
    // At ideal — just pay base cost
    return baseCost
  } else {
    // Excess neutrons — additional penalty
    const excess = -deficit
    return baseCost - excess // increasingly costly
  }
}

export function calcNeutronCost(
  protonCount: number,
  currentNeutronCount: number,
  neutronsToAdd: number
): number {
  // Returns the total stability delta (negative = costs stability)
  let total = 0
  for (let i = 0; i < neutronsToAdd; i++) {
    total += singleNeutronNetChange(protonCount, currentNeutronCount + i)
  }
  return total // negative means drain
}

// ── Electron Effect ────────────────────────────────────────────────────────────

export function calcElectronEffect(
  electronConfig: OrbitalShell[],
  electronsToAdd: number,
  atomicNumber?: number
): { stabilityDelta: number; newConfig: OrbitalShell[]; exceptionTriggered: boolean; exceptionDescription?: string } {
  const { newConfig, exceptionTriggered, exceptionDescription } = addElectrons(
    electronConfig,
    electronsToAdd,
    atomicNumber
  )
  const bonus = checkSubshellCompletionBonus(electronConfig, newConfig)
  return { stabilityDelta: bonus, newConfig, exceptionTriggered, exceptionDescription }
}

// ── Ionic Charge Penalty ───────────────────────────────────────────────────────

export function calcIonicChargePenalty(protonCount: number, electronCount: number): number {
  const charge = Math.abs(protonCount - electronCount)
  if (charge <= 3) return 0
  const excess = charge - 3
  return excess * 2
}

// ── End-of-Turn Ratio Drain ────────────────────────────────────────────────────

export function calcEndOfTurnRatioPenalty(protonCount: number, currentNeutrons: number): number {
  if (protonCount <= 0) return 0
  const ideal = calcIdealNeutrons(protonCount)
  const deviation = Math.abs(currentNeutrons - ideal)
  if (deviation <= 2) return 0
  return Math.floor(2 * deviation)
}

// ── Card Resolution ────────────────────────────────────────────────────────────

export function resolveCard(state: GameState, card: Card): GameState {
  let s = { ...state }

  // Handle special "only playable below 50%" restriction
  if (card.specialEffect === 'neutron_capture' && s.stabilityCurrentPercent >= 50) {
    // Card is restricted — return unchanged (caller should prevent this)
    return s
  }

  // Handle Nuclear Resonance activation
  if (card.specialEffect === 'nuclear_resonance') {
    s = { ...s, nuclearResonanceActive: true }
    s.stabilityCurrent = Math.max(0, s.stabilityCurrent + (card.stabilityDelta ?? 0))
    s.stabilityCurrentPercent = (s.stabilityCurrent / s.stabilityMax) * 100
    s.turnCount += 1
    return applyEndOfTurnChecks(s)
  }

  // Handle Decay Shield
  if (card.specialEffect === 'decay_shield') {
    s = { ...s, decayShieldTurns: s.decayShieldTurns + 2 }
    s.turnCount += 1
    return applyEndOfTurnChecks(s)
  }

  // Handle Stabilizer Pulse
  if (card.specialEffect === 'stabilizer_pulse') {
    const gain = card.stabilityDelta ?? 8
    s.stabilityCurrent = Math.min(s.stabilityMax, s.stabilityCurrent + gain)
    s.stabilityCurrentPercent = (s.stabilityCurrent / s.stabilityMax) * 100
    s.lastMessage = 'Stabilizer pulse activated — nuclear bonds reinforced.'
    s.turnCount += 1
    return applyEndOfTurnChecks(s)
  }

  // Handle Energy Well (wild card)
  if (card.specialEffect === 'energy_well') {
    const gain = card.stabilityDelta ?? 10
    s.stabilityMax = s.stabilityMax + gain
    s.stabilityCurrent = Math.min(s.stabilityMax, s.stabilityCurrent + gain)
    s.stabilityCurrentPercent = (s.stabilityCurrent / s.stabilityMax) * 100
    s.lastMessage = 'Energy well opened — stability pool expanded.'
    s.turnCount += 1
    return applyEndOfTurnChecks(s)
  }

  // Handle Isotope Shift (remove 1 neutron, gain stability)
  if (card.specialEffect === 'isotope_shift') {
    if (s.neutronCount > 0) {
      s.neutronCount -= 1
      const gain = card.stabilityDelta ?? 4
      s.stabilityCurrent = Math.min(s.stabilityMax, s.stabilityCurrent + gain)
      s.stabilityCurrentPercent = (s.stabilityCurrent / s.stabilityMax) * 100
      s.lastMessage = 'Isotope shift — neutron ejected, stability recovered.'
    }
    s.turnCount += 1
    return applyEndOfTurnChecks(s)
  }

  // Handle Beta Conversion (convert proton ↔ neutron)
  if (card.specialEffect === 'beta_conversion') {
    const ideal = calcIdealNeutrons(s.protonCount)
    if (s.neutronCount > ideal && s.protonCount >= 1) {
      // Neutron-heavy: convert neutron → proton
      s.neutronCount -= 1
      s.protonCount += 1
      s.lastMessage = 'Beta conversion — neutron converted to proton.'
    } else if (s.protonCount > 1) {
      // Proton-heavy: convert proton → neutron
      s.protonCount -= 1
      s.neutronCount += 1
      s.lastMessage = 'Beta conversion — proton converted to neutron.'
    }
    const cost = Math.abs(card.stabilityDelta ?? 3)
    s.stabilityCurrent = Math.max(0, s.stabilityCurrent - cost)
    s.stabilityCurrentPercent = (s.stabilityCurrent / s.stabilityMax) * 100
    s.turnCount += 1
    return applyEndOfTurnChecks(s)
  }

  // Handle Fission Gambit
  if (card.specialEffect === 'fission_gambit') {
    const removedP = Math.min(3, s.protonCount)
    const removedN = Math.min(3, s.neutronCount)
    s.protonCount -= removedP
    s.neutronCount -= removedN
    const cost = Math.abs(card.stabilityDelta ?? 10)
    s.stabilityCurrent = Math.max(0, s.stabilityCurrent - cost)
    s.stabilityCurrentPercent = (s.stabilityCurrent / s.stabilityMax) * 100
    s.lastMessage = 'Fission gambit — nucleus partially split. Stability cost paid.'
    s.turnCount += 1
    return applyEndOfTurnChecks(s)
  }

  // Handle Half-Life Timer activation
  if (card.specialEffect === 'half_life_timer') {
    s.halfLifeCountdown = 3
    s.lastMessage = 'Half-Life Timer started! Complete the atom within 3 turns or lose 20 stability!'
    s.turnCount += 1
    return applyEndOfTurnChecks(s)
  }

  // ── Particle additions ─────────────────────────────────────────────────────

  // Proton addition
  if (card.protonDelta > 0) {
    const protonCost = calcProtonCost(s.protonCount, card.protonDelta)
    s.stabilityCurrent = Math.max(0, s.stabilityCurrent - protonCost)
    s.protonCount += card.protonDelta
    s.lastMessage = `Proton repulsion increasing — neutrons can help stabilize. (Cost: ${protonCost})`
  } else if (card.protonDelta < 0) {
    s.protonCount = Math.max(0, s.protonCount + card.protonDelta)
    s.lastMessage = 'Protons removed from nucleus.'
  }

  // Neutron addition/removal
  if (card.neutronDelta !== 0) {
    let neutronNetChange = 0

    if (card.specialEffect === 'neutron_capture') {
      // Free neutron capture — no base cost
      neutronNetChange = 0
      s.lastMessage = 'Neutron capture — the nucleus absorbed neutrons from the environment.'
    } else {
      neutronNetChange = calcNeutronCost(
        s.protonCount,
        s.neutronCount,
        card.neutronDelta
      )
      if (s.nuclearResonanceActive && card.neutronDelta > 0) {
        // Double the refund portion
        const withoutResonance = neutronNetChange
        const bonus = Math.max(0, withoutResonance) // if positive, double it
        neutronNetChange = withoutResonance + bonus
        s.nuclearResonanceActive = false
      }
    }

    // Apply neutron stability change
    if (neutronNetChange >= 0) {
      s.stabilityCurrent = Math.min(s.stabilityMax, s.stabilityCurrent + neutronNetChange)
      if (card.neutronDelta > 0) s.lastMessage = 'Strong nuclear force strengthened.'
    } else {
      s.stabilityCurrent = Math.max(0, s.stabilityCurrent + neutronNetChange)
      if (card.neutronDelta > 0) s.lastMessage = 'Neutron overshoot — excess neutrons destabilizing nucleus.'
    }

    s.neutronCount = Math.max(0, s.neutronCount + card.neutronDelta)
  }

  // Electron addition
  if (card.electronDelta !== 0) {
    const atomicNumber = s.currentElement?.atomicNumber
    const { stabilityDelta, newConfig, exceptionTriggered, exceptionDescription } = calcElectronEffect(
      s.electronConfig,
      card.electronDelta,
      atomicNumber
    )

    s.electronConfig = newConfig
    s.electronCount = getElectronCount(newConfig)

    if (stabilityDelta > 0) {
      s.stabilityCurrent = Math.min(s.stabilityMax, s.stabilityCurrent + stabilityDelta)
      s.lastMessage = 'Stable electron configuration achieved.'
    }

    if (exceptionTriggered && exceptionDescription) {
      s.lastMessage = exceptionDescription
    }
  }

  // Apply any direct stability delta from the card itself
  if (card.stabilityDelta !== undefined && card.specialEffect === null) {
    if (card.stabilityDelta < 0) {
      s.stabilityCurrent = Math.max(0, s.stabilityCurrent + card.stabilityDelta)
    } else {
      s.stabilityCurrent = Math.min(s.stabilityMax, s.stabilityCurrent + card.stabilityDelta)
    }
  }

  // Ionic charge penalty (end-of-card check)
  const ionicPenalty = calcIonicChargePenalty(s.protonCount, s.electronCount)
  if (ionicPenalty > 0) {
    s.stabilityCurrent = Math.max(0, s.stabilityCurrent - ionicPenalty)
    s.lastMessage = 'Charge imbalance — atom is becoming too ionic.'
  }

  s.stabilityCurrentPercent = (s.stabilityCurrent / s.stabilityMax) * 100
  s.turnCount += 1

  return applyEndOfTurnChecks(s)
}

// ── End-of-Turn Checks ─────────────────────────────────────────────────────────

function applyEndOfTurnChecks(state: GameState): GameState {
  let s = { ...state }

  // End-of-turn ratio drain
  const ratioPenalty = calcEndOfTurnRatioPenalty(s.protonCount, s.neutronCount)
  if (ratioPenalty > 0) {
    s.stabilityCurrent = Math.max(0, s.stabilityCurrent - ratioPenalty)
  }

  // Gamma ray effect (multiplayer)
  if (s.gammaRayTurns > 0) {
    s.stabilityCurrent = Math.max(0, s.stabilityCurrent - 3)
    s.gammaRayTurns -= 1
  }

  // Half-life timer tick
  if (s.halfLifeCountdown > 0) {
    s.halfLifeCountdown -= 1
    if (s.halfLifeCountdown === 0) {
      s.stabilityCurrent = Math.max(0, s.stabilityCurrent - 20)
      s.lastMessage = 'Half-Life Timer expired! 20 stability lost!'
    }
  }

  // Decay shield countdown
  if (s.decayShieldTurns > 0) {
    s.decayShieldTurns -= 1
  }

  s.stabilityCurrentPercent = (s.stabilityCurrent / s.stabilityMax) * 100

  // Check win/loss
  s.isComplete = checkWinCondition(s)
  s.isFailed = checkLoseCondition(s)

  return s
}

// ── Decay Check ────────────────────────────────────────────────────────────────

export function performDecayCheck(state: GameState): { event: DecayEvent; newState: GameState } {
  const pct = state.stabilityCurrentPercent

  // No decay above 50% or when shielded
  if (pct >= 50 || state.decayShieldTurns > 0) {
    return { event: 'stable', newState: state }
  }

  const roll = Math.random()

  let event: DecayEvent

  if (pct < 25) {
    // Critical — decay guaranteed
    if (roll < 0.30) {
      event = 'double_decay'
    } else if (roll < 0.55) {
      event = 'beta_decay'
    } else if (roll < 0.75) {
      event = 'neutron_emission'
    } else {
      event = 'electron_ejection'
    }
  } else {
    // 25–50%: orange zone
    // ~35% chance at 40–50%, ~60% at 25–40%
    const decayThreshold = pct >= 40 ? 0.35 : 0.60
    if (roll < (1 - decayThreshold)) {
      event = 'stable'
    } else {
      const innerRoll = Math.random()
      if (innerRoll < 0.40) {
        event = 'beta_decay'
      } else if (innerRoll < 0.70) {
        event = 'neutron_emission'
      } else {
        event = 'electron_ejection'
      }
    }
  }

  const newState = applyDecayEvent(state, event)
  return { event, newState }
}

function applyDecayEvent(state: GameState, event: DecayEvent): GameState {
  let s = { ...state }

  const applyOnce = (s: GameState): GameState => {
    const decayType = pickSingleDecay(s)
    return applySingleDecay(s, decayType)
  }

  if (event === 'stable') {
    s.lastDecayEvent = 'stable'
    return s
  }

  if (event === 'double_decay') {
    s = applyOnce(s)
    s = applyOnce(s)
    s.lastDecayEvent = 'double_decay'
  } else {
    s = applySingleDecay(s, event)
    s.lastDecayEvent = event
  }

  s.stabilityCurrentPercent = (s.stabilityCurrent / s.stabilityMax) * 100
  return s
}

function pickSingleDecay(state: GameState): Exclude<DecayEvent, 'stable' | 'double_decay'> {
  const ideal = calcIdealNeutrons(state.protonCount)
  const isNeutronHeavy = state.neutronCount > ideal
  const roll = Math.random()

  if (isNeutronHeavy) {
    if (roll < 0.5) return 'beta_decay'
    if (roll < 0.8) return 'neutron_emission'
    return 'electron_ejection'
  } else {
    if (roll < 0.5) return 'beta_decay'
    return 'electron_ejection'
  }
}

function applySingleDecay(state: GameState, event: Exclude<DecayEvent, 'stable' | 'double_decay'>): GameState {
  let s = { ...state }

  if (event === 'beta_decay') {
    const ideal = calcIdealNeutrons(s.protonCount)
    if (s.neutronCount > ideal && s.neutronCount > 0) {
      // Neutron → proton
      s.neutronCount -= 1
      s.protonCount += 1
      s.lastMessage = 'A neutron has converted to a proton, emitting an electron. Your atomic number has changed!'
    } else if (s.protonCount > 1) {
      // Proton → neutron
      s.protonCount -= 1
      s.neutronCount += 1
      s.lastMessage = 'A proton has converted to a neutron, emitting a positron. Your atomic number has changed!'
    }
  } else if (event === 'neutron_emission') {
    if (s.neutronCount > 0) {
      s.neutronCount -= 1
      s.lastMessage = 'Your nucleus has ejected a neutron to seek stability. Mass number decreased by 1.'
    }
  } else if (event === 'electron_ejection') {
    if (s.electronCount > 0) {
      const newConfig = removeLastElectron(s.electronConfig)
      s.electronConfig = newConfig
      s.electronCount = getElectronCount(newConfig)
      s.lastMessage = 'High instability has ionized your atom. An electron was lost.'
    }
  }

  return s
}

// ── Win / Lose Conditions ──────────────────────────────────────────────────────

export function checkWinCondition(state: GameState): boolean {
  return (
    state.protonCount === state.targetProtons &&
    state.neutronCount === state.targetNeutrons &&
    state.electronCount === state.targetElectrons
  )
}

export function checkLoseCondition(state: GameState): boolean {
  if (state.stabilityCurrent <= 0) return true
  if (state.cardsRemaining <= 0 && !checkWinCondition(state)) return true
  return false
}

// ── Star Rating ────────────────────────────────────────────────────────────────

export function calcStarRating(
  state: GameState,
  turnLimit: number,
  stabilityThreshold: number
): 0 | 1 | 2 | 3 {
  if (!state.isComplete) return 0
  let stars: 0 | 1 | 2 | 3 = 1
  if (state.turnCount <= turnLimit) stars = 2
  if (state.turnCount <= turnLimit && state.stabilityCurrentPercent >= stabilityThreshold) stars = 3
  return stars
}

// ── Initial State Factory ──────────────────────────────────────────────────────

export function createInitialGameState(
  targetProtons: number,
  targetNeutrons: number,
  targetElectrons: number,
  gameMode: GameState['gameMode'],
  deck: Card[],
  tightBudget = false
): GameState {
  const massNumber = targetProtons + targetNeutrons
  const stabilityMax = calcStabilityMax(massNumber, tightBudget)
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
    currentElement: null,
    gameMode,
    isComplete: false,
    isFailed: false,
    hand,
    deck: remaining,
    lastDecayEvent: null,
    lastMessage: 'Build the target atom — add protons, neutrons, and electrons.',
    starRating: 0,
    halfLifeCountdown: 0,
    gammaRayTurns: 0,
  }
}
