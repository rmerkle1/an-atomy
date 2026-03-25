import type { OrbitalShell, Subshell } from '../types/game'

export const AUFBAU_ORDER: string[] = [
  '1s', '2s', '2p', '3s', '3p', '4s', '3d', '4p',
  '5s', '4d', '5p', '6s', '4f', '5d', '6p',
  '7s', '5f', '6d', '7p',
]

export const SUBSHELL_CAPACITY: Record<string, number> = {
  s: 2,
  p: 6,
  d: 10,
  f: 14,
}

// Aufbau exceptions: atomicNumber → array of [subshell, electrons] overrides
// These represent the actual ground-state configuration deviating from the naive Aufbau fill.
export const AUFBAU_EXCEPTIONS: Record<number, { description: string; overrides: Array<[string, number]> }> = {
  24: {
    description: 'Chromium exception! The atom is more stable when the d-orbitals are half-filled, so an s electron jumps over.',
    overrides: [['4s', 1], ['3d', 5]],
  },
  29: {
    description: 'Copper exception! A fully filled d-subshell is exceptionally stable, so an s electron jumps over.',
    overrides: [['4s', 1], ['3d', 10]],
  },
  42: {
    description: 'Molybdenum exception! Half-filled d-orbitals grant extra stability.',
    overrides: [['5s', 1], ['4d', 5]],
  },
  47: {
    description: 'Silver exception! A fully filled d-subshell is exceptionally stable.',
    overrides: [['5s', 1], ['4d', 10]],
  },
  78: {
    description: 'Platinum exception! Enhanced stability from a near-complete d-subshell.',
    overrides: [['6s', 1], ['5d', 9]],
  },
  79: {
    description: 'Gold exception! Fully filled d-subshell grants exceptional stability.',
    overrides: [['6s', 1], ['5d', 10]],
  },
}

// Build an empty orbital shell array for all shells 1–7
export function buildInitialElectronConfig(): OrbitalShell[] {
  return [
    { shellNumber: 1, subshells: [{ name: '1s', maxElectrons: 2, currentElectrons: 0 }] },
    { shellNumber: 2, subshells: [
        { name: '2s', maxElectrons: 2, currentElectrons: 0 },
        { name: '2p', maxElectrons: 6, currentElectrons: 0 },
      ],
    },
    { shellNumber: 3, subshells: [
        { name: '3s', maxElectrons: 2, currentElectrons: 0 },
        { name: '3p', maxElectrons: 6, currentElectrons: 0 },
        { name: '3d', maxElectrons: 10, currentElectrons: 0 },
      ],
    },
    { shellNumber: 4, subshells: [
        { name: '4s', maxElectrons: 2, currentElectrons: 0 },
        { name: '4p', maxElectrons: 6, currentElectrons: 0 },
        { name: '4d', maxElectrons: 10, currentElectrons: 0 },
        { name: '4f', maxElectrons: 14, currentElectrons: 0 },
      ],
    },
    { shellNumber: 5, subshells: [
        { name: '5s', maxElectrons: 2, currentElectrons: 0 },
        { name: '5p', maxElectrons: 6, currentElectrons: 0 },
        { name: '5d', maxElectrons: 10, currentElectrons: 0 },
        { name: '5f', maxElectrons: 14, currentElectrons: 0 },
      ],
    },
    { shellNumber: 6, subshells: [
        { name: '6s', maxElectrons: 2, currentElectrons: 0 },
        { name: '6p', maxElectrons: 6, currentElectrons: 0 },
        { name: '6d', maxElectrons: 10, currentElectrons: 0 },
      ],
    },
    { shellNumber: 7, subshells: [
        { name: '7s', maxElectrons: 2, currentElectrons: 0 },
        { name: '7p', maxElectrons: 6, currentElectrons: 0 },
      ],
    },
  ]
}

function deepCopyConfig(config: OrbitalShell[]): OrbitalShell[] {
  return config.map(shell => ({
    ...shell,
    subshells: shell.subshells.map(sub => ({ ...sub })),
  }))
}

function getSubshell(config: OrbitalShell[], name: string): Subshell | undefined {
  for (const shell of config) {
    const sub = shell.subshells.find(s => s.name === name)
    if (sub) return sub
  }
  return undefined
}

function totalElectronsInConfig(config: OrbitalShell[]): number {
  let total = 0
  for (const shell of config) {
    for (const sub of shell.subshells) {
      total += sub.currentElectrons
    }
  }
  return total
}

// Fill config with `count` electrons following Aufbau order, return updated config
function fillAufbau(config: OrbitalShell[], count: number): OrbitalShell[] {
  let remaining = count
  for (const subName of AUFBAU_ORDER) {
    if (remaining <= 0) break
    const sub = getSubshell(config, subName)
    if (!sub) continue
    const canAdd = sub.maxElectrons - sub.currentElectrons
    const adding = Math.min(canAdd, remaining)
    sub.currentElectrons += adding
    remaining -= adding
  }
  return config
}

export function addElectrons(
  config: OrbitalShell[],
  count: number,
  atomicNumber?: number
): { newConfig: OrbitalShell[]; exceptionTriggered: boolean; exceptionDescription?: string } {
  const newConfig = deepCopyConfig(config)
  fillAufbau(newConfig, count)

  // Check for Aufbau exception after filling
  if (atomicNumber !== undefined && AUFBAU_EXCEPTIONS[atomicNumber]) {
    const totalElectrons = totalElectronsInConfig(newConfig)
    if (totalElectrons === atomicNumber) {
      // Apply exception overrides
      const exception = AUFBAU_EXCEPTIONS[atomicNumber]
      for (const [subName, targetCount] of exception.overrides) {
        const sub = getSubshell(newConfig, subName)
        if (sub) sub.currentElectrons = targetCount
      }
      return { newConfig, exceptionTriggered: true, exceptionDescription: exception.description }
    }
  }

  return { newConfig, exceptionTriggered: false }
}

export function getElectronCount(config: OrbitalShell[]): number {
  return totalElectronsInConfig(config)
}

export function getLastFilledSubshell(config: OrbitalShell[]): string | null {
  let last: string | null = null
  for (const subName of AUFBAU_ORDER) {
    const sub = getSubshell(config, subName)
    if (sub && sub.currentElectrons > 0) {
      last = subName
    }
  }
  return last
}

// Returns the stability bonus from subshell completions when going from oldConfig to newConfig
export function checkSubshellCompletionBonus(
  oldConfig: OrbitalShell[],
  newConfig: OrbitalShell[]
): number {
  let bonus = 0

  for (const shell of newConfig) {
    for (const newSub of shell.subshells) {
      const oldShell = oldConfig.find(s => s.shellNumber === shell.shellNumber)
      const oldSub = oldShell?.subshells.find(s => s.name === newSub.name)
      const oldCount = oldSub?.currentElectrons ?? 0
      const newCount = newSub.currentElectrons

      const subType = newSub.name.slice(-1) // 's', 'p', 'd', 'f'

      if (subType === 's') {
        // Completing s (2 electrons): +2
        if (oldCount < 2 && newCount >= 2) bonus += 2
      } else if (subType === 'p') {
        // Half-filling p (3 electrons): +1
        if (oldCount < 3 && newCount >= 3) bonus += 1
        // Completing p (6 electrons): +4
        if (oldCount < 6 && newCount >= 6) bonus += 4
      } else if (subType === 'd') {
        // Half-filling d (5 electrons): +2
        if (oldCount < 5 && newCount >= 5) bonus += 2
        // Completing d (10 electrons): +6
        if (oldCount < 10 && newCount >= 10) bonus += 6
      }
    }
  }

  return bonus
}

// Remove the most recently placed electron (for electron ejection decay events)
export function removeLastElectron(config: OrbitalShell[]): OrbitalShell[] {
  const newConfig = deepCopyConfig(config)

  // Traverse in reverse Aufbau order to find last filled subshell
  for (let i = AUFBAU_ORDER.length - 1; i >= 0; i--) {
    const subName = AUFBAU_ORDER[i]
    const sub = getSubshell(newConfig, subName)
    if (sub && sub.currentElectrons > 0) {
      sub.currentElectrons -= 1
      return newConfig
    }
  }

  return newConfig
}
