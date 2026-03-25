import { useEffect, useState } from 'react'
import { useGameState } from '../hooks/useGameState'
import type { DecayEvent } from '../types/game'
import styles from '../styles/HUD.module.css'

const DECAY_LABELS: Record<DecayEvent, string> = {
  stable: 'STABLE — No Decay',
  beta_decay: 'BETA DECAY',
  neutron_emission: 'NEUTRON EMISSION',
  electron_ejection: 'ELECTRON EJECTION',
  double_decay: 'DOUBLE DECAY!',
}

const DECAY_DESCRIPTIONS: Record<DecayEvent, string> = {
  stable: 'The atom holds together. Crisis averted.',
  beta_decay: 'A neutron converted to a proton, emitting an electron. Your atomic number has changed!',
  neutron_emission: 'Your nucleus has ejected a neutron to seek stability. Mass number decreased by 1.',
  electron_ejection: 'High instability has ionized your atom. An electron was lost.',
  double_decay: 'Two decay events happened simultaneously! Severe instability.',
}

const DECAY_COLORS: Record<DecayEvent, string> = {
  stable: '#27ae60',
  beta_decay: '#e74c3c',
  neutron_emission: '#e67e22',
  electron_ejection: '#9b59b6',
  double_decay: '#c0392b',
}

export function DecayModal() {
  const { isDecayModalOpen, gameState, hideDecayModal } = useGameState()
  const [flipped, setFlipped] = useState(false)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    if (isDecayModalOpen) {
      setFlipped(false)
      setRevealed(false)

      // Auto-flip after a moment
      const flipTimer = setTimeout(() => setFlipped(true), 800)
      const revealTimer = setTimeout(() => setRevealed(true), 1200)

      return () => {
        clearTimeout(flipTimer)
        clearTimeout(revealTimer)
      }
    }
  }, [isDecayModalOpen])

  // Auto-close after reveal
  useEffect(() => {
    if (revealed && isDecayModalOpen) {
      const closeTimer = setTimeout(() => {
        hideDecayModal()
      }, 2500)
      return () => clearTimeout(closeTimer)
    }
  }, [revealed, isDecayModalOpen, hideDecayModal])

  if (!isDecayModalOpen) return null

  const event: DecayEvent = gameState?.lastDecayEvent ?? 'stable'
  const revealedEvent = revealed ? event : null
  const bgColor = revealedEvent ? DECAY_COLORS[revealedEvent] : '#1a2a4a'

  return (
    <div className={styles.decayModalOverlay} onClick={revealed ? hideDecayModal : undefined}>
      <div className={styles.decayModalCard} style={{ perspective: '800px' }}>
        <div
          className={styles.decayCardInner}
          style={{
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Card back */}
          <div className={styles.decayCardFace} style={{ backfaceVisibility: 'hidden' }}>
            <div className={styles.decayCardBack}>
              <div className={styles.decayCardQuestion}>?</div>
              <div className={styles.decayCardBackLabel}>DECAY CHECK</div>
            </div>
          </div>

          {/* Card front (revealed) */}
          <div
            className={styles.decayCardFace}
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              backgroundColor: bgColor,
            }}
          >
            {revealedEvent && (
              <div className={styles.decayCardFront}>
                <div className={styles.decayEventLabel}>
                  {DECAY_LABELS[revealedEvent]}
                </div>
                <div className={styles.decayEventDescription}>
                  {DECAY_DESCRIPTIONS[revealedEvent]}
                </div>
                {revealedEvent !== 'stable' && (
                  <div className={styles.decayEventWarning}>
                    ☢ Particle counts changed!
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {revealed && (
        <div className={styles.decayClickHint}>Click to continue</div>
      )}
    </div>
  )
}
