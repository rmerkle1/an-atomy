import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameState } from '../hooks/useGameState'
import { ELEMENTS } from '../data/elements'
import { buildFreeDeck } from '../game/deckBuilder'
import { TUTORIAL_LEVELS } from '../data/levels'
import styles from '../styles/MainMenu.module.css'

// Deterministically pick today's daily puzzle element based on date
function getDailyElement(): { symbol: string; targetProtons: number; targetNeutrons: number; targetElectrons: number } {
  const today = new Date()
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
  const idx = seed % 36 // first 36 elements
  const el = ELEMENTS[idx]

  return {
    symbol: el.symbol,
    targetProtons: el.atomicNumber,
    targetNeutrons: el.standardNeutrons,
    targetElectrons: el.atomicNumber,
  }
}

export function DailyPuzzle() {
  const navigate = useNavigate()
  const { initFreePlay, gameState } = useGameState()

  const daily = getDailyElement()
  const element = ELEMENTS.find(e => e.symbol === daily.symbol)!

  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  const handleStart = () => {
    initFreePlay(daily.symbol, 2)
    navigate(`/game/${daily.symbol}`)
  }

  return (
    <div className={styles.menuRoot}>
      <div className={styles.menuContent}>
        <button className={styles.backButton} onClick={() => navigate('/')}>
          ← Back
        </button>

        <h1 className={styles.titleMain} style={{ fontSize: '2rem' }}>Daily Puzzle</h1>
        <p className={styles.titleTagline}>{dateStr}</p>

        <div className={styles.dailyCard}>
          <div className={styles.dailyElementDisplay}>
            <div className={styles.dailyAtomicNumber}>{element.atomicNumber}</div>
            <div className={styles.dailySymbol}>{element.symbol}</div>
            <div className={styles.dailyElementName}>{element.name}</div>
          </div>

          <div className={styles.dailyTargetInfo}>
            <h3 className={styles.dailyTargetTitle}>Today's Target</h3>
            <div className={styles.dailyTargetRow}>
              <span style={{ color: '#e74c3c' }}>Protons:</span>
              <span>{daily.targetProtons}</span>
            </div>
            <div className={styles.dailyTargetRow}>
              <span style={{ color: '#95a5a6' }}>Neutrons:</span>
              <span>{daily.targetNeutrons}</span>
            </div>
            <div className={styles.dailyTargetRow}>
              <span style={{ color: '#4fc3f7' }}>Electrons:</span>
              <span>{daily.targetElectrons}</span>
            </div>
          </div>

          <div className={styles.dailyRules}>
            <p>Build the target atom using the provided card deck.</p>
            <p>All players worldwide have the same puzzle today.</p>
            <p>Compare your turn count and stability score on the leaderboard!</p>
          </div>

          <button
            className={`${styles.menuButton} ${styles.buttonPrimary}`}
            onClick={handleStart}
          >
            Start Today's Puzzle
          </button>
        </div>
      </div>
    </div>
  )
}
