import { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import { BootScene } from '../scenes/BootScene'
import { GameScene } from '../scenes/GameScene'
import { UIScene } from '../scenes/UIScene'
import { useGameStore } from '../store/gameStore'
import styles from '../styles/GameBoard.module.css'

interface GameBoardProps {
  width?: number
  height?: number
}

export function GameBoard({ width = 800, height = 600 }: GameBoardProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<Phaser.Game | null>(null)
  const gameState = useGameStore(s => s.gameState)

  useEffect(() => {
    if (!containerRef.current) return

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width,
      height,
      parent: containerRef.current,
      backgroundColor: '#0a0a1a',
      scene: [BootScene, GameScene, UIScene],
      physics: {
        default: 'arcade',
        arcade: { debug: false },
      },
      render: {
        antialias: true,
        powerPreference: 'high-performance',
      },
    }

    const game = new Phaser.Game(config)
    gameRef.current = game

    return () => {
      game.destroy(true)
      gameRef.current = null
    }
  }, [width, height])

  // Bridge React game state to Phaser
  useEffect(() => {
    if (!gameRef.current || !gameState) return
    gameRef.current.events.emit('game_state_update', gameState)
  }, [gameState])

  // Bridge fission events
  useEffect(() => {
    if (!gameRef.current || !gameState) return
    if (gameState.isFailed && gameState.stabilityCurrent <= 0) {
      gameRef.current.events.emit('show_fission')
    }
  }, [gameState?.isFailed, gameState?.stabilityCurrent])

  return (
    <div className={styles.gameBoardWrapper}>
      <div ref={containerRef} className={styles.phaserContainer} />
    </div>
  )
}
