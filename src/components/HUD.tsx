import { StabilityMeter } from './StabilityMeter'
import { ProgressPanel } from './ProgressPanel'
import { CardComponent } from './CardComponent'
import { CompanionPanel } from './CompanionPanel'
import { useGameState } from '../hooks/useGameState'
import type { Card } from '../types/game'
import styles from '../styles/HUD.module.css'

export function HUD() {
  const {
    gameState,
    canPlayCard,
    canDiscard,
    canUseCompanion,
    playCard,
    useCompanion,
    discardCard,
    currentLevelConfig,
  } = useGameState()

  if (!gameState) return null

  const showDiscard = gameState.gameMode !== 'tutorial' && canDiscard

  const handleRevealTarget = () => {
    // Could show a modal with target info — for now just highlight
  }

  return (
    <div className={styles.hudRoot}>
      {/* Left column — Stability Meter */}
      <div className={styles.hudLeft}>
        <StabilityMeter gameState={gameState} />
      </div>

      {/* Center — Cards + status message */}
      <div className={styles.hudCenter}>
        {/* Status message */}
        <div className={styles.statusMessage}>
          {gameState.lastMessage}
        </div>

        {/* Card hand */}
        <div className={styles.cardHand}>
          {gameState.hand.map((card: Card, idx: number) => (
            <CardComponent
              key={`${card.id}-${idx}`}
              card={card}
              index={idx}
              onPlay={playCard}
              onDiscard={showDiscard ? discardCard : undefined}
              disabled={gameState.isComplete || gameState.isFailed}
              restricted={
                card.specialEffect === 'neutron_capture' &&
                gameState.stabilityCurrentPercent >= 50
              }
            />
          ))}
        </div>

        {/* Bottom row — Companion + Reveal target button */}
        <div className={styles.hudBottomRow}>
          <CompanionPanel
            gameState={gameState}
            onUseCompanion={useCompanion}
          />

          <div className={styles.revealArea}>
            {currentLevelConfig && (
              <div className={styles.targetHint}>
                Target: {gameState.targetProtons}p /
                {gameState.targetNeutrons}n /
                {gameState.targetElectrons}e
              </div>
            )}
          </div>
        </div>

        {/* Win/lose overlay */}
        {gameState.isComplete && (
          <div className={styles.winOverlay}>
            <div className={styles.winTitle}>ATOM COMPLETE!</div>
            <div className={styles.starRating}>
              {Array.from({ length: 3 }).map((_, i) => (
                <span key={i} className={i < gameState.starRating ? styles.starFilled : styles.starEmpty}>
                  ★
                </span>
              ))}
            </div>
          </div>
        )}

        {gameState.isFailed && (
          <div className={styles.loseOverlay}>
            <div className={styles.loseTitle}>ATOM DESTABILIZED</div>
            <div className={styles.loseSubtitle}>
              {gameState.stabilityCurrent <= 0
                ? 'Stability reached zero — fission occurred!'
                : 'No cards remaining — build incomplete.'}
            </div>
          </div>
        )}
      </div>

      {/* Right column — Progress Panel */}
      <div className={styles.hudRight}>
        <ProgressPanel gameState={gameState} />
      </div>
    </div>
  )
}
