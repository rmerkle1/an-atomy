import type { GameState } from '../types/game'
import styles from '../styles/HUD.module.css'

interface StabilityMeterProps {
  gameState: GameState
}

function getZoneColor(pct: number): string {
  if (pct >= 75) return '#27ae60'
  if (pct >= 50) return '#f39c12'
  if (pct >= 25) return '#e67e22'
  return '#e74c3c'
}

function getZoneLabel(pct: number): string {
  if (pct >= 75) return 'STABLE'
  if (pct >= 50) return 'EXCITED'
  if (pct >= 25) return 'DECAY RISK'
  return 'CRITICAL'
}

interface IndicatorProps {
  label: string
  icon: string
  active: boolean
  color: string
}

function Indicator({ label, icon, active, color }: IndicatorProps) {
  return (
    <div className={styles.indicator} style={{ opacity: active ? 1 : 0.3 }}>
      <span className={styles.indicatorIcon} style={{ color: active ? color : '#555' }}>
        {icon}
      </span>
      <span className={styles.indicatorLabel}>{label}</span>
    </div>
  )
}

export function StabilityMeter({ gameState }: StabilityMeterProps) {
  const pct = Math.max(0, Math.min(100, gameState.stabilityCurrentPercent))
  const color = getZoneColor(pct)
  const zoneLabel = getZoneLabel(pct)

  // Indicator states
  const nuclearIndicator = gameState.protonCount > 0
  const chargeIndicator = Math.abs(gameState.protonCount - gameState.electronCount) > 1
  const shellIndicator = gameState.electronCount > 0

  const nuclearColor = (() => {
    const ideal = gameState.protonCount > 0
      ? gameState.protonCount * (gameState.protonCount <= 20 ? 1.0 : 1.0 + (gameState.protonCount - 20) * 0.025)
      : 0
    const dev = Math.abs(gameState.neutronCount - ideal)
    if (dev < 2) return '#27ae60'
    if (dev < 5) return '#f39c12'
    return '#e74c3c'
  })()

  const chargeColor = (() => {
    const imbalance = Math.abs(gameState.protonCount - gameState.electronCount)
    if (imbalance <= 1) return '#27ae60'
    if (imbalance <= 3) return '#f39c12'
    return '#e74c3c'
  })()

  const shellColor = '#4fc3f7'

  return (
    <div className={styles.stabilityMeter}>
      {/* Stacked "STABILITY" label */}
      <div className={styles.stabilityLabel}>
        {'STABILITY'.split('').map((ch, i) => (
          <span key={i} className={styles.stabilityLetter} style={{ color }}>
            {ch}
          </span>
        ))}
      </div>

      {/* Vertical bar */}
      <div className={styles.barContainer}>
        <div className={styles.barTrack}>
          {/* Zone lines */}
          <div className={styles.zoneLine} style={{ bottom: '75%' }} />
          <div className={styles.zoneLine} style={{ bottom: '50%' }} />
          <div className={styles.zoneLine} style={{ bottom: '25%' }} />

          {/* Fill */}
          <div
            className={styles.barFill}
            style={{
              height: `${pct}%`,
              backgroundColor: color,
              boxShadow: `0 0 10px ${color}88`,
              transition: 'height 0.4s ease, background-color 0.4s ease',
            }}
          />
        </div>
        <div className={styles.barPercent} style={{ color }}>
          {Math.round(pct)}%
        </div>
        <div className={styles.barZoneLabel} style={{ color }}>
          {zoneLabel}
        </div>
      </div>

      {/* Three indicator icons */}
      <div className={styles.indicators}>
        <Indicator
          label="NUC"
          icon="⚛"
          active={nuclearIndicator}
          color={nuclearColor}
        />
        <Indicator
          label="CHG"
          icon="⚡"
          active={chargeIndicator}
          color={chargeColor}
        />
        <Indicator
          label="SHL"
          icon="○"
          active={shellIndicator}
          color={shellColor}
        />
      </div>

      {/* Decay shield indicator */}
      {gameState.decayShieldTurns > 0 && (
        <div className={styles.shieldBadge}>
          🛡 {gameState.decayShieldTurns}t
        </div>
      )}
    </div>
  )
}
