import Phaser from 'phaser'
import type { DecayEvent } from '../types/game'

export class UIScene extends Phaser.Scene {
  private decayCardGraphics: Phaser.GameObjects.Container | null = null
  private dimOverlay: Phaser.GameObjects.Graphics | null = null

  constructor() {
    super({ key: 'UIScene' })
  }

  create() {
    // Listen for decay check events from React bridge
    this.game.events.on('show_decay_check', (event: DecayEvent) => {
      this.showDecayCard(event)
    })

    this.game.events.on('hide_decay_check', () => {
      this.hideDecayCard()
    })

    this.game.events.on('show_fission', () => {
      this.showFissionAnimation()
    })
  }

  showDecayCard(event: DecayEvent) {
    if (this.decayCardGraphics) return

    const width = this.cameras.main.width
    const height = this.cameras.main.height

    // Dim overlay
    this.dimOverlay = this.add.graphics()
    this.dimOverlay.fillStyle(0x000000, 0.7)
    this.dimOverlay.fillRect(0, 0, width, height)
    this.dimOverlay.setAlpha(0)

    this.tweens.add({
      targets: this.dimOverlay,
      alpha: 1,
      duration: 300,
    })

    // Card container
    const cardX = width / 2
    const cardY = height / 2
    const container = this.add.container(cardX, cardY)

    // Card back (face down initially)
    const cardBg = this.add.graphics()
    cardBg.fillStyle(0x1a2a4a, 1)
    cardBg.lineStyle(2, 0x4fc3f7, 1)
    cardBg.fillRoundedRect(-70, -90, 140, 180, 12)
    cardBg.strokeRoundedRect(-70, -90, 140, 180, 12)

    const cardLabel = this.add.text(0, -10, '?', {
      fontSize: '48px',
      color: '#4fc3f7',
      fontFamily: 'monospace',
    }).setOrigin(0.5)

    const subLabel = this.add.text(0, 60, 'DECAY\nCHECK', {
      fontSize: '14px',
      color: '#4fc3f7',
      fontFamily: 'monospace',
      align: 'center',
    }).setOrigin(0.5)

    container.add([cardBg, cardLabel, subLabel])
    container.setScale(0)

    this.tweens.add({
      targets: container,
      scaleX: 1,
      scaleY: 1,
      duration: 300,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Flip to reveal after a short pause
        this.time.delayedCall(600, () => {
          this.flipCardToReveal(container, cardBg, cardLabel, subLabel, event)
        })
      },
    })

    this.decayCardGraphics = container
  }

  private flipCardToReveal(
    container: Phaser.GameObjects.Container,
    bg: Phaser.GameObjects.Graphics,
    label: Phaser.GameObjects.Text,
    subLabel: Phaser.GameObjects.Text,
    event: DecayEvent
  ) {
    // Flip animation: squish to 0 width, then expand with new content
    this.tweens.add({
      targets: container,
      scaleX: 0,
      duration: 200,
      ease: 'Linear',
      onComplete: () => {
        // Update card content
        bg.clear()
        label.destroy()
        subLabel.destroy()

        const { color, title, desc } = this.getDecayEventDisplay(event)

        const newBg = this.add.graphics()
        newBg.fillStyle(color, 1)
        newBg.lineStyle(2, 0xffffff, 0.8)
        newBg.fillRoundedRect(-70, -90, 140, 180, 12)
        newBg.strokeRoundedRect(-70, -90, 140, 180, 12)

        const titleText = this.add.text(0, -40, title, {
          fontSize: '16px',
          color: '#ffffff',
          fontFamily: 'monospace',
          align: 'center',
          wordWrap: { width: 120 },
        }).setOrigin(0.5)

        const descText = this.add.text(0, 30, desc, {
          fontSize: '11px',
          color: '#ffffff',
          fontFamily: 'monospace',
          align: 'center',
          wordWrap: { width: 120 },
        }).setOrigin(0.5)

        container.add([newBg, titleText, descText])

        this.tweens.add({
          targets: container,
          scaleX: 1,
          duration: 200,
          ease: 'Linear',
          onComplete: () => {
            // Auto-dismiss after 2 seconds
            this.time.delayedCall(2000, () => {
              this.game.events.emit('decay_check_complete', event)
              this.hideDecayCard()
            })
          },
        })
      },
    })
  }

  private getDecayEventDisplay(event: DecayEvent): { color: number; title: string; desc: string } {
    switch (event) {
      case 'stable':
        return { color: 0x27ae60, title: 'STABLE\nNo Decay', desc: 'The atom holds together.' }
      case 'beta_decay':
        return { color: 0xe74c3c, title: 'BETA\nDECAY', desc: 'A neutron converted\nto a proton.' }
      case 'neutron_emission':
        return { color: 0xe67e22, title: 'NEUTRON\nEMISSION', desc: 'A neutron escaped\nthe nucleus.' }
      case 'electron_ejection':
        return { color: 0x9b59b6, title: 'ELECTRON\nEJECTION', desc: 'An electron was\nstripped away.' }
      case 'double_decay':
        return { color: 0xc0392b, title: 'DOUBLE\nDECAY!', desc: 'Two decay events\nhappened at once!' }
    }
  }

  hideDecayCard() {
    if (this.decayCardGraphics) {
      this.tweens.add({
        targets: this.decayCardGraphics,
        alpha: 0,
        scaleX: 0.8,
        scaleY: 0.8,
        duration: 300,
        onComplete: () => {
          this.decayCardGraphics?.destroy()
          this.decayCardGraphics = null
        },
      })
    }
    if (this.dimOverlay) {
      this.tweens.add({
        targets: this.dimOverlay,
        alpha: 0,
        duration: 300,
        onComplete: () => {
          this.dimOverlay?.destroy()
          this.dimOverlay = null
        },
      })
    }
  }

  showFissionAnimation() {
    const width = this.cameras.main.width
    const height = this.cameras.main.height

    const flash = this.add.graphics()
    flash.fillStyle(0xff0000, 1)
    flash.fillRect(0, 0, width, height)

    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 800,
      ease: 'Power2.easeOut',
    })

    const text = this.add.text(width / 2, height / 2, 'FISSION!\nAtom Destroyed', {
      fontSize: '36px',
      color: '#ff4444',
      fontFamily: 'monospace',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5)

    this.tweens.add({
      targets: text,
      alpha: 0,
      y: text.y - 100,
      duration: 2000,
      delay: 500,
      onComplete: () => text.destroy(),
    })
  }
}
