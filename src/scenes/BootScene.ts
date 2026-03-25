import Phaser from 'phaser'

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' })
  }

  preload() {
    // Create a loading bar
    const width = this.cameras.main.width
    const height = this.cameras.main.height

    const progressBar = this.add.graphics()
    const progressBox = this.add.graphics()
    progressBox.fillStyle(0x1a1a3e, 1)
    progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50)

    const loadingText = this.make.text({
      x: width / 2,
      y: height / 2 - 50,
      text: 'Loading An Atomy...',
      style: {
        font: '20px monospace',
        color: '#4fc3f7',
      },
    })
    loadingText.setOrigin(0.5, 0.5)

    this.load.on('progress', (value: number) => {
      progressBar.clear()
      progressBar.fillStyle(0x4fc3f7, 1)
      progressBar.fillRect(width / 2 - 155, height / 2 - 20, 310 * value, 40)
    })

    this.load.on('complete', () => {
      progressBar.destroy()
      progressBox.destroy()
      loadingText.destroy()
    })

    // We generate all visuals programmatically in GameScene,
    // so there are no external assets to load right now.
    // This scene exists to allow future asset loading without changing architecture.
  }

  create() {
    this.scene.start('GameScene')
  }
}
