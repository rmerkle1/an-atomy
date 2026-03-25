import type { Card } from '../types/game'
import styles from '../styles/HUD.module.css'

interface CardComponentProps {
  card: Card
  index: number
  onPlay: (index: number) => void
  onDiscard?: (index: number) => void
  disabled?: boolean
  restricted?: boolean
}

const TIER_COLORS: Record<number, string> = {
  0: '#ffd700',
  1: '#4fc3f7',
  2: '#00e5ff',
  3: '#69f0ae',
  4: '#ff6e40',
  5: '#ea80fc',
}

const TIER_LABELS: Record<number, string> = {
  0: 'WILD',
  1: 'T1',
  2: 'T2',
  3: 'T3',
  4: 'T4',
  5: 'INT',
}

function ParticleDots({ protonDelta, neutronDelta, electronDelta }: {
  protonDelta: number
  neutronDelta: number
  electronDelta: number
}) {
  const dots: { color: string; label: string }[] = []

  for (let i = 0; i < Math.abs(protonDelta); i++) {
    dots.push({ color: protonDelta > 0 ? '#e74c3c' : '#888', label: protonDelta > 0 ? 'p' : '-p' })
  }
  for (let i = 0; i < Math.abs(neutronDelta); i++) {
    dots.push({ color: neutronDelta > 0 ? '#95a5a6' : '#888', label: neutronDelta > 0 ? 'n' : '-n' })
  }
  for (let i = 0; i < Math.abs(electronDelta); i++) {
    dots.push({ color: electronDelta > 0 ? '#4fc3f7' : '#888', label: electronDelta > 0 ? 'e' : '-e' })
  }

  return (
    <div className={styles.particleDots}>
      {dots.map((dot, i) => (
        <span
          key={i}
          className={styles.particleDot}
          style={{ backgroundColor: dot.color }}
          title={dot.label}
        />
      ))}
    </div>
  )
}

export function CardComponent({
  card,
  index,
  onPlay,
  onDiscard,
  disabled = false,
  restricted = false,
}: CardComponentProps) {
  const tierColor = TIER_COLORS[card.tier] ?? '#4fc3f7'
  const tierLabel = TIER_LABELS[card.tier] ?? 'T?'

  const isPlayable = !disabled && !restricted
  const cardClass = [
    styles.card,
    isPlayable ? styles.cardPlayable : '',
    restricted ? styles.cardRestricted : '',
    disabled ? styles.cardDisabled : '',
    card.isInterference ? styles.cardInterference : '',
  ].filter(Boolean).join(' ')

  return (
    <div
      className={cardClass}
      style={{ borderColor: tierColor }}
      onClick={() => isPlayable && onPlay(index)}
      role="button"
      tabIndex={isPlayable ? 0 : -1}
      aria-label={`Play ${card.name}`}
      onKeyDown={e => e.key === 'Enter' && isPlayable && onPlay(index)}
    >
      {/* Tier badge */}
      <div
        className={styles.tierBadge}
        style={{ backgroundColor: tierColor, color: '#000' }}
      >
        {tierLabel}
      </div>

      {/* Card name */}
      <div className={styles.cardName} style={{ color: tierColor }}>
        {card.name}
      </div>

      {/* Particle dots */}
      <ParticleDots
        protonDelta={card.protonDelta}
        neutronDelta={card.neutronDelta}
        electronDelta={card.electronDelta}
      />

      {/* Card description */}
      <div className={styles.cardDescription}>
        {card.description}
      </div>

      {/* Restriction badge */}
      {restricted && (
        <div className={styles.restrictedBadge}>
          Below 50% only
        </div>
      )}

      {/* Discard button */}
      {onDiscard && !disabled && (
        <button
          className={styles.discardButton}
          onClick={e => {
            e.stopPropagation()
            onDiscard(index)
          }}
          title="Discard this card (costs 5% stability)"
          aria-label={`Discard ${card.name}`}
        >
          🗑
        </button>
      )}
    </div>
  )
}
