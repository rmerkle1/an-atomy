import type { LevelConfig, CompanionAtom } from '../types/game'
import { ELEMENTS } from './elements'
import { buildTutorialDeck } from '../game/deckBuilder'

function el(symbol: string) {
  const element = ELEMENTS.find(e => e.symbol === symbol)
  if (!element) throw new Error(`Element not found: ${symbol}`)
  return element
}

const noCompanion: CompanionAtom[] = []

const metalCompanion1: CompanionAtom = {
  elementSymbol: 'Li',
  charge: 1,
  usesRemaining: 3,
  usesTotal: 3,
}

const metalCompanion2: CompanionAtom = {
  elementSymbol: 'Na',
  charge: 1,
  usesRemaining: 3,
  usesTotal: 3,
}

export const TUTORIAL_LEVELS: LevelConfig[] = [
  // Level 1 — Hydrogen
  {
    element: el('H'),
    targetProtons: 1,
    targetNeutrons: 0,
    targetElectrons: 1,
    turnLimit: 5,
    stabilityThreshold: 80,
    deck: buildTutorialDeck(1),
    companionOptions: noCompanion,
    tutorialPrompts: [
      'Welcome to An Atomy! Your goal is to build atoms by playing particle cards.',
      'Start by playing the Single Proton card to define your element.',
      'Protons define what element you are building — 1 proton means Hydrogen!',
      'Now play Single Electron to balance the charge. Electrons orbit the nucleus.',
      'Perfect! You\'ve built a Hydrogen atom. Proton count = Atomic Number.',
    ],
  },

  // Level 2 — Helium
  {
    element: el('He'),
    targetProtons: 2,
    targetNeutrons: 2,
    targetElectrons: 2,
    turnLimit: 8,
    stabilityThreshold: 75,
    deck: buildTutorialDeck(2),
    companionOptions: noCompanion,
    tutorialPrompts: [
      'Building Helium — you need 2 protons, 2 neutrons, and 2 electrons.',
      'Notice how adding that second proton made the stability meter dip!',
      'Proton-proton repulsion destabilizes the nucleus. Neutrons provide the "glue".',
      'Play Neutron Pair — watch the stability bar recover!',
      'Completing the 1s orbital with 2 electrons gives a bonus — noble gas stability!',
      'That flash was a subshell completion bonus. Full shells = extra stability.',
    ],
  },

  // Level 3 — Lithium
  {
    element: el('Li'),
    targetProtons: 3,
    targetNeutrons: 4,
    targetElectrons: 3,
    turnLimit: 12,
    stabilityThreshold: 65,
    deck: buildTutorialDeck(3),
    companionOptions: noCompanion,
    tutorialPrompts: [
      'Lithium has 3 protons. You now have 3 cards to choose from each turn!',
      'The second electron shell (n=2) is now visible in the orbital diagram.',
      'The third electron goes into the 2s orbital — a new shell begins!',
      '2 stars: finish within the turn limit. 3 stars: also keep stability above threshold.',
      'Try to interleave neutrons with protons for best stability results.',
    ],
  },

  // Level 4 — Beryllium
  {
    element: el('Be'),
    targetProtons: 4,
    targetNeutrons: 5,
    targetElectrons: 4,
    turnLimit: 14,
    stabilityThreshold: 60,
    deck: buildTutorialDeck(4),
    companionOptions: noCompanion,
    tutorialPrompts: [
      'Beryllium — no training wheels! Apply what you\'ve learned.',
      'Remember: balance protons with neutrons to keep the nucleus stable.',
      'The 2s orbital will complete when you add the 4th electron — watch for the bonus!',
    ],
  },

  // Level 5 — Boron
  {
    element: el('B'),
    targetProtons: 5,
    targetNeutrons: 6,
    targetElectrons: 5,
    turnLimit: 16,
    stabilityThreshold: 60,
    deck: buildTutorialDeck(5),
    companionOptions: noCompanion,
    tutorialPrompts: [
      'New cards unlocked! Proton Cluster, Neutron Cluster, and Electron Trio are available.',
      'Bigger cards are efficient — but risky. A Proton Cluster costs more stability than 3 Single Protons played when the nucleus is still small.',
      'The 2p orbital is now visible. Boron\'s 5th electron fills the first p slot.',
      'Tier 2 cards are now available for future levels. More tools = more strategy!',
    ],
  },

  // Level 6 — Carbon
  {
    element: el('C'),
    targetProtons: 6,
    targetNeutrons: 6,
    targetElectrons: 6,
    turnLimit: 18,
    stabilityThreshold: 55,
    deck: buildTutorialDeck(6),
    companionOptions: noCompanion,
    tutorialPrompts: [
      'Carbon-12: 6 protons, 6 neutrons, 6 electrons. The most common isotope.',
      'An isotope is defined by its neutron count. Same element, different mass number.',
      'Carbon-14 has 8 neutrons instead of 6 — that\'s what makes it radioactive!',
      'Try to complete this as Carbon-12 first. Notice how the ideal ratio holds at 1:1 for small atoms.',
    ],
  },

  // Level 7 — Nitrogen
  {
    element: el('N'),
    targetProtons: 7,
    targetNeutrons: 7,
    targetElectrons: 7,
    turnLimit: 20,
    stabilityThreshold: 55,
    deck: buildTutorialDeck(7),
    companionOptions: noCompanion,
    tutorialPrompts: [
      'Tier 2 cards are in your deck now. Bundles and bursts give you more options.',
      'Nitrogen\'s 2p³ configuration is a half-filled p subshell — watch for the bonus!',
      'Half-filled subshells are extra stable. You\'ll see this pattern again with d-orbitals in heavier elements.',
      'The Neutron Burst card can rescue you if you\'ve fallen behind on neutrons.',
    ],
  },

  // Level 8 — Oxygen
  {
    element: el('O'),
    targetProtons: 8,
    targetNeutrons: 8,
    targetElectrons: 8,
    turnLimit: 22,
    stabilityThreshold: 50,
    deck: buildTutorialDeck(8),
    companionOptions: [metalCompanion1],
    tutorialPrompts: [
      'You have a companion atom! The Lithium companion can donate 1 electron per use.',
      'Use the companion button (bottom-left) to trigger a companion action.',
      'Companion use costs a small amount of stability — it\'s not free, but it\'s flexible.',
      'Oxygen really wants 8 electrons. Your companion can help you get there faster.',
    ],
  },

  // Level 9 — Fluorine (F⁻ ion)
  {
    element: el('F'),
    targetProtons: 9,
    targetNeutrons: 10,
    targetElectrons: 10,
    turnLimit: 24,
    stabilityThreshold: 50,
    deck: buildTutorialDeck(9),
    companionOptions: [metalCompanion2],
    tutorialPrompts: [
      'Target: Fluoride ion (F⁻). That means 9 protons but 10 electrons!',
      'Fluorine gains 1 electron to become F⁻ — this is ionic charge.',
      'Having more electrons than protons creates a negative charge.',
      'Watch the ionic charge penalty — if the charge gap exceeds 3, stability drains.',
      'Your sodium companion can donate that extra electron you need.',
    ],
  },

  // Level 10 — Neon
  {
    element: el('Ne'),
    targetProtons: 10,
    targetNeutrons: 10,
    targetElectrons: 10,
    turnLimit: 25,
    stabilityThreshold: 60,
    deck: buildTutorialDeck(10),
    companionOptions: [metalCompanion1, metalCompanion2],
    tutorialPrompts: [
      'Neon — the noble gas capstone! A complete tutorial awaits.',
      'All Tier 1 and Tier 2 cards are available. Use them wisely.',
      'Neon\'s configuration: 1s² 2s² 2p⁶ — every subshell complete!',
      'You\'ll earn bonus stability each time a subshell fills — watch the meter celebrate.',
      'Three stars requires efficiency AND stability. Plan your card plays carefully.',
      'After Neon, free play mode unlocks. The entire periodic table awaits!',
    ],
  },
]

export function getLevelByIndex(index: number): LevelConfig {
  return TUTORIAL_LEVELS[index]
}

export function getLevelForElement(symbol: string): LevelConfig | undefined {
  return TUTORIAL_LEVELS.find(l => l.element.symbol === symbol)
}
