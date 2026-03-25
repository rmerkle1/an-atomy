import type { Card } from '../types/game'
import { CARDS, getCardsByTier } from '../data/cards'

// Shuffle an array in-place using Fisher-Yates
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function getCardById(id: string): Card {
  const card = CARDS.find(c => c.id === id)
  if (!card) throw new Error(`Card not found: ${id}`)
  return card
}

// Build a curated tutorial deck for a given level (1–10)
export function buildTutorialDeck(level: number): Card[] {
  const T1 = (id: string) => getCardById(id)

  switch (level) {
    case 1:
      // Hydrogen: just proton + electron cards
      return [
        T1('t1_single_proton'),
        T1('t1_single_electron'),
        T1('t1_single_proton'),
        T1('t1_single_electron'),
      ]

    case 2:
      // Helium: introduce neutrons
      return [
        T1('t1_single_proton'),
        T1('t1_single_neutron'),
        T1('t1_neutron_pair'),
        T1('t1_single_proton'),
        T1('t1_electron_pair'),
        T1('t1_single_electron'),
      ]

    case 3:
      // Lithium: 3-card drafting, second shell
      return shuffle([
        T1('t1_single_proton'),
        T1('t1_proton_pair'),
        T1('t1_single_neutron'),
        T1('t1_neutron_pair'),
        T1('t1_single_electron'),
        T1('t1_electron_pair'),
        T1('t1_single_proton'),
        T1('t1_single_neutron'),
        T1('t1_single_electron'),
      ])

    case 4:
      // Beryllium: less guided
      return shuffle([
        T1('t1_single_proton'),
        T1('t1_proton_pair'),
        T1('t1_single_neutron'),
        T1('t1_neutron_pair'),
        T1('t1_neutron_cluster'),
        T1('t1_single_electron'),
        T1('t1_electron_pair'),
        T1('t1_proton_pair'),
        T1('t1_single_neutron'),
        T1('t1_electron_pair'),
      ])

    case 5:
      // Boron: introduce clusters + Tier 2
      return shuffle([
        T1('t1_proton_cluster'),
        T1('t1_neutron_cluster'),
        T1('t1_electron_trio'),
        T1('t1_single_proton'),
        T1('t1_neutron_pair'),
        T1('t1_single_electron'),
        getCardById('t2_proton_neutron_bundle'),
        getCardById('t2_alpha_bundle'),
        T1('t1_single_neutron'),
        T1('t1_electron_pair'),
        T1('t1_proton_pair'),
        T1('t1_single_electron'),
      ])

    case 6:
      // Carbon: isotopes
      return shuffle([
        T1('t1_proton_pair'),
        T1('t1_proton_cluster'),
        T1('t1_neutron_pair'),
        T1('t1_neutron_cluster'),
        T1('t1_electron_trio'),
        T1('t1_electron_pair'),
        getCardById('t2_alpha_bundle'),
        getCardById('t2_proton_neutron_bundle'),
        getCardById('t2_stabilizer_pulse'),
        T1('t1_single_neutron'),
        T1('t1_single_proton'),
        T1('t1_single_electron'),
      ])

    case 7:
      // Nitrogen: Tier 2 cards, half-filled bonus
      return shuffle([
        getCardById('t2_proton_neutron_bundle'),
        getCardById('t2_electron_proton_bundle'),
        getCardById('t2_neutron_burst'),
        getCardById('t2_stabilizer_pulse'),
        getCardById('t2_alpha_bundle'),
        T1('t1_single_proton'),
        T1('t1_neutron_pair'),
        T1('t1_electron_trio'),
        T1('t1_proton_pair'),
        T1('t1_electron_pair'),
        T1('t1_single_neutron'),
        T1('t1_single_electron'),
        T1('t1_proton_cluster'),
      ])

    case 8:
      // Oxygen: companion atoms introduced
      return shuffle([
        getCardById('t2_proton_neutron_bundle'),
        getCardById('t2_alpha_bundle'),
        getCardById('t2_neutron_burst'),
        getCardById('t2_stabilizer_pulse'),
        getCardById('t2_electron_proton_bundle'),
        getCardById('t2_decay_shield'),
        T1('t1_proton_pair'),
        T1('t1_neutron_pair'),
        T1('t1_electron_trio'),
        T1('t1_single_proton'),
        T1('t1_single_neutron'),
        T1('t1_single_electron'),
        T1('t1_electron_pair'),
      ])

    case 9:
      // Fluorine: ionic charge (F⁻)
      return shuffle([
        getCardById('t2_proton_neutron_bundle'),
        getCardById('t2_alpha_bundle'),
        getCardById('t2_neutron_burst'),
        getCardById('t2_stabilizer_pulse'),
        getCardById('t2_electron_proton_bundle'),
        getCardById('t2_decay_shield'),
        T1('t1_proton_cluster'),
        T1('t1_neutron_cluster'),
        T1('t1_electron_trio'),
        T1('t1_electron_pair'),
        T1('t1_single_proton'),
        T1('t1_neutron_pair'),
        T1('t1_single_electron'),
        T1('t1_proton_pair'),
      ])

    case 10:
      // Neon: capstone, all Tier 1+2 available
      return shuffle([
        getCardById('t2_proton_neutron_bundle'),
        getCardById('t2_alpha_bundle'),
        getCardById('t2_neutron_burst'),
        getCardById('t2_stabilizer_pulse'),
        getCardById('t2_electron_proton_bundle'),
        getCardById('t2_decay_shield'),
        T1('t1_proton_pair'),
        T1('t1_proton_cluster'),
        T1('t1_neutron_pair'),
        T1('t1_neutron_cluster'),
        T1('t1_electron_trio'),
        T1('t1_electron_pair'),
        T1('t1_single_proton'),
        T1('t1_single_neutron'),
        T1('t1_single_electron'),
        getCardById('t2_proton_neutron_bundle'),
      ])

    default:
      return buildFreeDeck(1)
  }
}

// Build a random deck for free play, weighted by available tiers
export function buildFreeDeck(maxTier: number, size = 24): Card[] {
  const available = CARDS.filter(c => c.tier <= maxTier && !c.isInterference)
  const pool: Card[] = []

  // Weight lower tiers more heavily
  for (const card of available) {
    const weight = Math.max(1, maxTier - card.tier + 1)
    for (let i = 0; i < weight; i++) {
      pool.push(card)
    }
  }

  const deck: Card[] = []
  for (let i = 0; i < size; i++) {
    deck.push(pool[Math.floor(Math.random() * pool.length)])
  }

  return shuffle(deck)
}

// Build a multiplayer deck (includes interference cards)
export function buildMultiplayerDeck(maxTier: number): Card[] {
  const nonInterference = CARDS.filter(
    c => c.tier <= maxTier && !c.isInterference && c.tier > 0
  )
  const interference = getCardsByTier(5)
  const pool = [...nonInterference, ...interference.slice(0, 3)]
  return shuffle(pool)
}

// Draw N cards from deck, returning [drawn, remainingDeck]
export function drawCards(deck: Card[], count: number): [Card[], Card[]] {
  const drawn = deck.slice(0, count)
  const remaining = deck.slice(count)
  return [drawn, remaining]
}

// Replace played card in hand with top of deck
export function replaceCardInHand(
  hand: Card[],
  playedIndex: number,
  deck: Card[]
): { newHand: Card[]; newDeck: Card[] } {
  const newHand = [...hand]
  if (deck.length > 0) {
    newHand[playedIndex] = deck[0]
    return { newHand, newDeck: deck.slice(1) }
  } else {
    newHand.splice(playedIndex, 1)
    return { newHand, newDeck: [] }
  }
}
