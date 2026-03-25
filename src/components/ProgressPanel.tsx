import type { GameState } from '../types/game'
import styles from '../styles/HUD.module.css'

interface ProgressPanelProps {
  gameState: GameState
}

function progressPercent(current: number, target: number): number {
  if (target === 0) return 100
  return Math.min(100, (current / target) * 100)
}

interface ParticleRowProps {
  label: string
  current: number
  target: number
  color: string
}

function ParticleRow({ label, current, target, color }: ParticleRowProps) {
  const pct = progressPercent(current, target)
  const done = current === target
  return (
    <div className={styles.particleRow}>
      <span className={styles.particleLabel} style={{ color }}>{label}</span>
      <div className={styles.particleBarTrack}>
        <div
          className={styles.particleBarFill}
          style={{
            width: `${pct}%`,
            backgroundColor: done ? '#27ae60' : color,
            transition: 'width 0.3s ease',
          }}
        />
      </div>
      <span className={styles.particleCount} style={{ color: done ? '#27ae60' : '#aaa' }}>
        {current}/{target}
      </span>
    </div>
  )
}

export function ProgressPanel({ gameState }: ProgressPanelProps) {
  const deckPercent = gameState.cardsRemaining > 0
    ? (gameState.cardsRemaining / (gameState.cardsRemaining + gameState.turnCount)) * 100
    : 0

  const allDone =
    gameState.protonCount === gameState.targetProtons &&
    gameState.neutronCount === gameState.targetNeutrons &&
    gameState.electronCount === gameState.targetElectrons

  return (
    <div className={styles.progressPanel}>
      {/* Stacked "PROGRESS" label */}
      <div className={styles.progressLabel}>
        {'PROGRESS'.split('').map((ch, i) => (
          <span key={i} className={styles.progressLetter}>
            {ch}
          </span>
        ))}
      </div>

      {/* Target element info */}
      {gameState.currentElement && (
        <div className={styles.targetElement}>
          <span className={styles.elementSymbol}>
            {gameState.currentElement.symbol}
          </span>
          <span className={styles.elementName}>
            {gameState.currentElement.name}
          </span>
        </div>
      )}

      {/* Particle progress bars */}
      <div className={styles.particleProgress}>
        <ParticleRow
          label="P"
          current={gameState.protonCount}
          target={gameState.targetProtons}
          color="#e74c3c"
        />
        <ParticleRow
          label="N"
          current={gameState.neutronCount}
          target={gameState.targetNeutrons}
          color="#95a5a6"
        />
        <ParticleRow
          label="E"
          current={gameState.electronCount}
          target={gameState.targetElectrons}
          color="#4fc3f7"
        />
      </div>

      {/* Turn counter */}
      <div className={styles.turnCounter}>
        <span className={styles.turnLabel}>TURN</span>
        <span className={styles.turnCount}>{gameState.turnCount}</span>
      </div>

      {/* Deck tracker */}
      <div className={styles.deckTracker}>
        <div className={styles.deckLabel}>DECK</div>
        <div className={styles.deckBarTrack}>
          <div
            className={styles.deckBarFill}
            style={{ width: `${deckPercent}%` }}
          />
        </div>
        <div className={styles.deckCount}>{gameState.cardsRemaining} left</div>
      </div>

      {/* Half-life timer */}
      {gameState.halfLifeCountdown > 0 && (
        <div className={styles.halfLifeTimer}>
          ☢ {gameState.halfLifeCountdown} turns
        </div>
      )}

      {/* Complete / Failed overlay */}
      {allDone && (
        <div className={styles.completeBadge}>
          ✓ COMPLETE
        </div>
      )}
    </div>
  )
}
