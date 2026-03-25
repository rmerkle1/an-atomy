import type { GameState } from '../types/game'
import styles from '../styles/HUD.module.css'

interface CompanionPanelProps {
  gameState: GameState
  onUseCompanion: () => void
}

export function CompanionPanel({ gameState, onUseCompanion }: CompanionPanelProps) {
  if (!gameState.companionType) return null

  const charge = gameState.companionCharge
  const uses = gameState.companionUsesRemaining
  const isAvailable = uses > 0 && !gameState.isComplete && !gameState.isFailed

  const companionName =
    gameState.companionType === 'metal'
      ? charge === 1 ? 'Li' : charge === 2 ? 'Mg' : 'Al'
      : charge === -1 ? 'F' : charge === -2 ? 'O' : 'N'

  const chargeLabel = charge > 0 ? `+${charge}` : `${charge}`
  const actionLabel = gameState.companionType === 'metal'
    ? `Donate ${Math.abs(charge)}e`
    : `Accept ${Math.abs(charge)}e`

  const usesDots = Array.from({ length: gameState.companionUsesRemaining })

  return (
    <div className={styles.companionPanel}>
      <div className={styles.companionHeader}>COMPANION</div>

      <div className={styles.companionAtom}>
        <div className={styles.companionSymbol}>{companionName}</div>
        <div className={styles.companionCharge}>{chargeLabel}</div>
      </div>

      <div className={styles.companionUses}>
        {usesDots.map((_, i) => (
          <span key={i} className={styles.useDot} />
        ))}
        {Array.from({ length: Math.max(0, 3 - uses) }).map((_, i) => (
          <span key={`empty-${i}`} className={styles.useDotEmpty} />
        ))}
      </div>

      <button
        className={[styles.companionButton, isAvailable ? styles.companionButtonActive : ''].join(' ')}
        onClick={onUseCompanion}
        disabled={!isAvailable}
        title={`${actionLabel} (costs 3 stability)`}
      >
        {actionLabel}
      </button>
    </div>
  )
}
