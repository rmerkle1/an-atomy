import Phaser from 'phaser'
import type { GameState, OrbitalShell } from '../types/game'

const NUCLEUS_X = 400
const NUCLEUS_Y = 520
const BASE_NUCLEUS_RADIUS = 40
const SHELL_SPACING = 55

// Color constants
const PROTON_COLOR = 0xe74c3c
const NEUTRON_COLOR = 0x95a5a6
const ELECTRON_COLOR = 0x4fc3f7
const ELECTRON_EMPTY_COLOR = 0x2c3e50
const SHELL_ARC_COLOR = 0x2a4a6a
const SHELL_ACTIVE_COLOR = 0x4fc3f7
const BG_COLOR = 0x0a0a1a
const NUCLEUS_BG_COLOR = 0x1a2a4a

const AUFBAU_ORDER = ['1s', '2s', '2p', '3s', '3p', '4s', '3d', '4p', '5s', '4d', '5p']

interface ParticleDot {
  graphics: Phaser.GameObjects.Graphics
  x: number
  y: number
  color: number
}

export class GameScene extends Phaser.Scene {
  private gameState: GameState | null = null
  private nucleusGraphics!: Phaser.GameObjects.Graphics
  private shellGraphics!: Phaser.GameObjects.Graphics
  private electronDots: Map<string, Phaser.GameObjects.Graphics[]> = new Map()

  constructor() {
    super({ key: 'GameScene' })
  }

  create() {
    this.cameras.main.setBackgroundColor(BG_COLOR)

    this.nucleusGraphics = this.add.graphics()
    this.shellGraphics = this.add.graphics()

    // Draw initial empty nucleus
    this.drawNucleus(0, 0)
    this.drawShells([])

    // Listen for game state updates from React bridge
    this.game.events.on('game_state_update', (state: GameState) => {
      this.updateFromGameState(state)
    })

    // Draw idle animation
    this.time.addEvent({
      delay: 50,
      callback: this.idlePulse,
      callbackScope: this,
      loop: true,
    })
  }

  private idlePulse() {
    if (!this.gameState) return
    // Subtle glow pulse on nucleus
    const pct = this.gameState.stabilityCurrentPercent
    const color =
      pct >= 75 ? 0x27ae60 :
      pct >= 50 ? 0xf39c12 :
      pct >= 25 ? 0xe67e22 :
      0xe74c3c

    this.nucleusGraphics.clear()
    this.drawNucleus(this.gameState.protonCount, this.gameState.neutronCount, color)
  }

  updateFromGameState(state: GameState) {
    const prevState = this.gameState
    this.gameState = state

    // Animate new protons/neutrons
    if (prevState) {
      const newProtons = state.protonCount - prevState.protonCount
      const newNeutrons = state.neutronCount - prevState.neutronCount

      if (newProtons > 0) {
        this.animateParticlesIntoNucleus(newProtons, PROTON_COLOR)
      } else if (newProtons < 0) {
        this.removeParticlesFromNucleus(Math.abs(newProtons), PROTON_COLOR)
      }

      if (newNeutrons > 0) {
        this.animateParticlesIntoNucleus(newNeutrons, NEUTRON_COLOR)
      } else if (newNeutrons < 0) {
        this.removeParticlesFromNucleus(Math.abs(newNeutrons), NEUTRON_COLOR)
      }

      // Update electron shells
      this.updateElectronShells(prevState.electronConfig, state.electronConfig)
    }

    this.shellGraphics.clear()
    this.drawShells(state.electronConfig)
  }

  private drawNucleus(protonCount: number, neutronCount: number, glowColor?: number) {
    const g = this.nucleusGraphics
    g.clear()

    const total = protonCount + neutronCount
    const radius = Math.min(BASE_NUCLEUS_RADIUS + Math.sqrt(total) * 3, 80)

    // Glow effect
    const gColor = glowColor ??
      (this.gameState
        ? (this.gameState.stabilityCurrentPercent >= 75 ? 0x27ae60 :
           this.gameState.stabilityCurrentPercent >= 50 ? 0xf39c12 :
           this.gameState.stabilityCurrentPercent >= 25 ? 0xe67e22 : 0xe74c3c)
        : 0x27ae60)

    // Outer glow
    g.fillStyle(gColor, 0.15)
    g.fillCircle(NUCLEUS_X, NUCLEUS_Y, radius + 12)

    // Middle glow
    g.fillStyle(gColor, 0.25)
    g.fillCircle(NUCLEUS_X, NUCLEUS_Y, radius + 6)

    // Nucleus background
    g.fillStyle(NUCLEUS_BG_COLOR, 1)
    g.fillCircle(NUCLEUS_X, NUCLEUS_Y, radius)

    // Draw half-circle clipping (bottom half only)
    // We draw the full circle but the canvas clips to the top half via CSS

    // Pack protons and neutrons as small circles inside nucleus
    if (total > 0) {
      const particleRadius = Math.max(4, Math.min(10, radius / (Math.sqrt(total) + 1)))

      let pIdx = 0
      let nIdx = 0
      const totalParticles = protonCount + neutronCount

      for (let i = 0; i < totalParticles; i++) {
        const angle = (i / totalParticles) * Math.PI * 2
        const dist = (radius - particleRadius - 2) * (i < 6 ? 0.4 : i < 14 ? 0.7 : 0.9)
        const px = NUCLEUS_X + Math.cos(angle) * dist
        const py = NUCLEUS_Y + Math.sin(angle) * dist

        if (pIdx < protonCount) {
          g.fillStyle(PROTON_COLOR, 1)
          pIdx++
        } else {
          g.fillStyle(NEUTRON_COLOR, 1)
          nIdx++
        }
        g.fillCircle(px, py, particleRadius)
      }
    } else {
      // Empty nucleus placeholder
      g.lineStyle(2, 0x2a4a6a, 0.8)
      g.strokeCircle(NUCLEUS_X, NUCLEUS_Y, radius)
      const text = this.add.text(NUCLEUS_X, NUCLEUS_Y, '?', {
        fontSize: '24px',
        color: '#2a4a6a',
        fontFamily: 'monospace',
      }).setOrigin(0.5)
      this.time.delayedCall(100, () => text.destroy())
    }
  }

  private drawShells(electronConfig: OrbitalShell[]) {
    const g = this.shellGraphics
    g.clear()

    // Clear existing electron dot overlays
    this.electronDots.forEach(dots => dots.forEach(d => d.destroy()))
    this.electronDots.clear()

    const visibleSubshells = AUFBAU_ORDER.slice(0, Math.min(AUFBAU_ORDER.length, 8))

    // Draw concentric half-circle arcs (upper half)
    let shellIdx = 0
    let prevShellNumber = -1

    for (let i = 0; i < visibleSubshells.length; i++) {
      const subshellName = visibleSubshells[i]
      const shellNumber = parseInt(subshellName[0])

      if (shellNumber !== prevShellNumber) {
        shellIdx++
        prevShellNumber = shellNumber
      }

      const arcRadius = BASE_NUCLEUS_RADIUS + 20 + shellIdx * SHELL_SPACING

      // Find subshell data
      let subshell = null
      for (const shell of electronConfig) {
        const found = shell.subshells.find(s => s.name === subshellName)
        if (found) { subshell = found; break }
      }

      const isFilled = subshell && subshell.currentElectrons > 0
      const isComplete = subshell && subshell.currentElectrons >= subshell.maxElectrons

      // Draw arc
      g.lineStyle(
        isComplete ? 2.5 : 1.5,
        isFilled ? SHELL_ACTIVE_COLOR : SHELL_ARC_COLOR,
        isFilled ? 0.7 : 0.3
      )

      // Draw semicircle arc (top half only, sweeping from left to right above nucleus)
      const segments = 32
      const startAngle = Math.PI  // left side (180°)

      let px = NUCLEUS_X + Math.cos(startAngle) * arcRadius
      let py = NUCLEUS_Y + Math.sin(startAngle) * arcRadius
      g.beginPath()
      g.moveTo(px, py)

      for (let seg = 1; seg <= segments; seg++) {
        const angle = startAngle - (seg / segments) * Math.PI
        px = NUCLEUS_X + Math.cos(angle) * arcRadius
        py = NUCLEUS_Y + Math.sin(angle) * arcRadius
        g.lineTo(px, py)
      }
      g.strokePath()

      // Draw electron slots along arc
      if (subshell) {
        const maxE = subshell.maxElectrons
        const currentE = subshell.currentElectrons
        const dots: Phaser.GameObjects.Graphics[] = []

        for (let eIdx = 0; eIdx < maxE; eIdx++) {
          // Position along arc
          const t = maxE === 1 ? 0.5 : eIdx / (maxE - 1)
          const angle = Math.PI - t * Math.PI
          const ex = NUCLEUS_X + Math.cos(angle) * arcRadius
          const ey = NUCLEUS_Y + Math.sin(angle) * arcRadius

          const dot = this.add.graphics()
          const filled = eIdx < currentE
          const dotColor = filled ? ELECTRON_COLOR : ELECTRON_EMPTY_COLOR
          const dotAlpha = filled ? 1 : 0.5

          dot.fillStyle(dotColor, dotAlpha)
          dot.fillCircle(ex, ey, 5)

          if (!filled) {
            dot.lineStyle(1, SHELL_ARC_COLOR, 0.6)
            dot.strokeCircle(ex, ey, 5)
          }

          dots.push(dot)
        }

        // Subshell label
        const labelAngle = Math.PI * 1.08
        const lx = NUCLEUS_X + Math.cos(labelAngle) * arcRadius - 20
        const ly = NUCLEUS_Y + Math.sin(labelAngle) * arcRadius

        const label = this.add.text(lx, ly, subshellName, {
          fontSize: '10px',
          color: isFilled ? '#4fc3f7' : '#2a4a6a',
          fontFamily: 'monospace',
        }).setOrigin(1, 0.5)
        dots.push(label as unknown as Phaser.GameObjects.Graphics)

        this.electronDots.set(subshellName, dots)
      }
    }
  }

  private animateParticlesIntoNucleus(count: number, color: number) {
    for (let i = 0; i < count; i++) {
      // Start from outside the canvas top
      const startX = NUCLEUS_X + (Math.random() - 0.5) * 300
      const startY = -30

      const particle = this.add.graphics()
      particle.fillStyle(color, 1)
      particle.fillCircle(0, 0, 7)
      particle.x = startX
      particle.y = startY

      const delay = i * 80

      this.time.delayedCall(delay, () => {
        this.tweens.add({
          targets: particle,
          x: NUCLEUS_X + (Math.random() - 0.5) * 20,
          y: NUCLEUS_Y,
          duration: 400,
          ease: 'Power2.easeIn',
          onComplete: () => {
            // Flash on impact
            particle.clear()
            particle.fillStyle(0xffffff, 1)
            particle.fillCircle(0, 0, 10)
            this.time.delayedCall(100, () => particle.destroy())
          },
        })
      })
    }
  }

  private removeParticlesFromNucleus(count: number, color: number) {
    for (let i = 0; i < count; i++) {
      const particle = this.add.graphics()
      particle.fillStyle(color, 0.8)
      particle.fillCircle(0, 0, 6)
      particle.x = NUCLEUS_X
      particle.y = NUCLEUS_Y

      const endX = NUCLEUS_X + (Math.random() - 0.5) * 400
      const endY = -60

      this.tweens.add({
        targets: particle,
        x: endX,
        y: endY,
        alpha: 0,
        duration: 500,
        ease: 'Power2.easeOut',
        onComplete: () => particle.destroy(),
      })
    }
  }

  private updateElectronShells(
    oldConfig: OrbitalShell[],
    newConfig: OrbitalShell[]
  ) {
    // Find newly added electrons and animate them arcing along shell paths
    for (const newShell of newConfig) {
      const oldShell = oldConfig.find(s => s.shellNumber === newShell.shellNumber)
      for (const newSub of newShell.subshells) {
        const oldSub = oldShell?.subshells.find(s => s.name === newSub.name)
        const oldCount = oldSub?.currentElectrons ?? 0
        const added = newSub.currentElectrons - oldCount

        if (added > 0) {
          this.animateElectronToShell(newSub.name, oldCount, added)
        } else if (added < 0) {
          // Electron ejected — animate outward
          this.animateElectronEjection(newSub.name)
        }
      }
    }
  }

  private animateElectronToShell(subshellName: string, startIdx: number, count: number) {
    let shellIdx = 0
    let prevSN = -1
    for (const name of AUFBAU_ORDER) {
      const sn = parseInt(name[0])
      if (sn !== prevSN) { shellIdx++; prevSN = sn }
      if (name === subshellName) break
    }

    const arcRadius = BASE_NUCLEUS_RADIUS + 20 + shellIdx * SHELL_SPACING

    for (let i = 0; i < count; i++) {
      const eIdx = startIdx + i
      const maxE = subshellName.endsWith('s') ? 2 : subshellName.endsWith('p') ? 6 : 10
      const t = maxE <= 1 ? 0.5 : eIdx / (maxE - 1)
      const targetAngle = Math.PI - t * Math.PI
      const tx = NUCLEUS_X + Math.cos(targetAngle) * arcRadius
      const ty = NUCLEUS_Y + Math.sin(targetAngle) * arcRadius

      const electron = this.add.graphics()
      electron.fillStyle(ELECTRON_COLOR, 1)
      electron.fillCircle(0, 0, 6)
      electron.x = NUCLEUS_X
      electron.y = NUCLEUS_Y

      this.time.delayedCall(i * 100, () => {
        this.tweens.add({
          targets: electron,
          x: tx,
          y: ty,
          duration: 350,
          ease: 'Power2.easeOut',
          onComplete: () => electron.destroy(),
        })
      })
    }
  }

  private animateElectronEjection(subshellName: string) {
    let shellIdx = 0
    let prevSN = -1
    for (const name of AUFBAU_ORDER) {
      const sn = parseInt(name[0])
      if (sn !== prevSN) { shellIdx++; prevSN = sn }
      if (name === subshellName) break
    }
    const arcRadius = BASE_NUCLEUS_RADIUS + 20 + shellIdx * SHELL_SPACING

    const electron = this.add.graphics()
    electron.fillStyle(ELECTRON_COLOR, 1)
    electron.fillCircle(0, 0, 6)
    electron.x = NUCLEUS_X
    electron.y = NUCLEUS_Y - arcRadius

    this.tweens.add({
      targets: electron,
      x: NUCLEUS_X + (Math.random() > 0.5 ? 300 : -300),
      y: -80,
      alpha: 0,
      duration: 600,
      ease: 'Power2.easeIn',
      onComplete: () => electron.destroy(),
    })
  }

  // Called when a decay check triggers fission visual
  triggerFissionAnimation() {
    const flash = this.add.graphics()
    flash.fillStyle(0xff0000, 0.8)
    flash.fillRect(0, 0, 800, 600)
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 500,
      onComplete: () => flash.destroy(),
    })

    // Scatter particles
    for (let i = 0; i < 16; i++) {
      const p = this.add.graphics()
      p.fillStyle(i % 2 === 0 ? PROTON_COLOR : NEUTRON_COLOR, 1)
      p.fillCircle(0, 0, 6)
      p.x = NUCLEUS_X
      p.y = NUCLEUS_Y

      this.tweens.add({
        targets: p,
        x: NUCLEUS_X + (Math.random() - 0.5) * 600,
        y: NUCLEUS_Y + (Math.random() - 0.5) * 400,
        alpha: 0,
        duration: 800,
        ease: 'Power2.easeOut',
        onComplete: () => p.destroy(),
      })
    }
  }

  // Trigger subshell bonus celebration
  triggerSubshellBonus(subshellName: string) {
    let shellIdx = 0
    let prevSN = -1
    for (const name of AUFBAU_ORDER) {
      const sn = parseInt(name[0])
      if (sn !== prevSN) { shellIdx++; prevSN = sn }
      if (name === subshellName) break
    }
    const arcRadius = BASE_NUCLEUS_RADIUS + 20 + shellIdx * SHELL_SPACING

    // Ring of sparkles
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2
      const sparkle = this.add.graphics()
      sparkle.fillStyle(0xffd700, 1)
      sparkle.fillCircle(0, 0, 4)
      sparkle.x = NUCLEUS_X + Math.cos(angle) * arcRadius
      sparkle.y = NUCLEUS_Y + Math.sin(angle) * arcRadius

      this.tweens.add({
        targets: sparkle,
        x: sparkle.x + Math.cos(angle) * 30,
        y: sparkle.y + Math.sin(angle) * 30,
        alpha: 0,
        scaleX: 0.1,
        scaleY: 0.1,
        duration: 600,
        ease: 'Power2.easeOut',
        onComplete: () => sparkle.destroy(),
      })
    }
  }
}
