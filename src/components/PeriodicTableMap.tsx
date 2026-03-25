import { useNavigate } from 'react-router-dom'
import { ELEMENTS } from '../data/elements'
import type { Element } from '../types/game'
import styles from '../styles/PeriodicTable.module.css'

// Tutorial elements (locked until tutorial complete)
const TUTORIAL_ELEMENTS = new Set(['H', 'He', 'Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne'])

// Hard-coded completion state (in a real app, this would come from localStorage/server)
function getCompletionState(_symbol: string): 'locked' | 'available' | 'completed' | 'mastered' {
  // For now, tutorial elements are available, rest locked
  // TODO: wire to persistent progress
  if (TUTORIAL_ELEMENTS.has(_symbol)) return 'available'
  return 'locked'
}

const CATEGORY_COLORS: Record<string, string> = {
  'nonmetal': '#1565c0',
  'noble-gas': '#6a1b9a',
  'alkali-metal': '#b71c1c',
  'alkaline-earth': '#e65100',
  'metalloid': '#2e7d32',
  'post-transition': '#4a148c',
  'transition-metal': '#006064',
  'halogen': '#004d40',
  'lanthanide': '#37474f',
  'actinide': '#263238',
}

const STATUS_OVERLAY: Record<string, string> = {
  locked: '#0a0a1a',
  available: 'transparent',
  completed: '#27ae6044',
  mastered: '#ffd70044',
}

interface ElementCellProps {
  element: Element
  status: 'locked' | 'available' | 'completed' | 'mastered'
  onClick: () => void
}

function ElementCell({ element, status, onClick }: ElementCellProps) {
  const bgColor = CATEGORY_COLORS[element.category] ?? '#1a2a4a'
  const isLocked = status === 'locked'

  return (
    <button
      className={`${styles.elementCell} ${styles[`status_${status}`]}`}
      style={{
        backgroundColor: isLocked ? '#111' : bgColor,
        borderColor: status === 'mastered' ? '#ffd700' : status === 'completed' ? '#27ae60' : '#2a4a6a',
        opacity: isLocked ? 0.3 : 1,
        cursor: isLocked ? 'not-allowed' : 'pointer',
        gridColumn: element.group,
        gridRow: element.period,
      }}
      onClick={isLocked ? undefined : onClick}
      disabled={isLocked}
      title={`${element.name} (Z=${element.atomicNumber})`}
    >
      <span className={styles.atomicNumber}>{element.atomicNumber}</span>
      <span className={styles.elementSymbolCell}>{element.symbol}</span>
      {status === 'completed' && <span className={styles.completedMark}>✓</span>}
      {status === 'mastered' && <span className={styles.masteredMark}>★</span>}
    </button>
  )
}

export function PeriodicTableMap() {
  const navigate = useNavigate()

  // Main table elements (periods 1–7, groups 1–18)
  const mainElements = ELEMENTS.filter(
    e => e.period <= 7 && e.category !== 'lanthanide' && e.category !== 'actinide'
  )

  // Lanthanides (period 6, f-block row 1)
  const lanthanides = ELEMENTS.filter(e => e.category === 'lanthanide')
  // Actinides (period 7, f-block row 2)
  const actinides = ELEMENTS.filter(e => e.category === 'actinide')

  const handleElementClick = (symbol: string) => {
    navigate(`/game/${symbol}`)
  }

  return (
    <div className={styles.periodicTableRoot}>
      <div className={styles.tableHeader}>
        <h2 className={styles.tableTitle}>Periodic Table — Element Selector</h2>
        <p className={styles.tableSubtitle}>Choose an element to build. Complete the tutorial first to unlock more!</p>
      </div>

      {/* Legend */}
      <div className={styles.legend}>
        <span className={styles.legendItem}>
          <span className={styles.legendDot} style={{ borderColor: '#2a4a6a' }} /> Available
        </span>
        <span className={styles.legendItem}>
          <span className={styles.legendDot} style={{ borderColor: '#27ae60' }} /> Completed
        </span>
        <span className={styles.legendItem}>
          <span className={styles.legendDot} style={{ borderColor: '#ffd700' }} /> Mastered
        </span>
        <span className={styles.legendItem}>
          <span className={styles.legendDot} style={{ borderColor: '#333', opacity: 0.3 }} /> Locked
        </span>
      </div>

      {/* Main table grid */}
      <div className={styles.tableGrid}>
        {mainElements.map(element => (
          <ElementCell
            key={element.symbol}
            element={element}
            status={getCompletionState(element.symbol)}
            onClick={() => handleElementClick(element.symbol)}
          />
        ))}

        {/* Spacer for lanthanides/actinides separator */}
        <div
          className={styles.fBlockSpacer}
          style={{ gridColumn: '3', gridRow: '8 / span 2' }}
        >
          <span className={styles.fBlockLabel}>f-block</span>
        </div>
      </div>

      {/* f-block rows */}
      <div className={styles.fBlockTable}>
        <div className={styles.fBlockRow}>
          <span className={styles.fBlockPeriodLabel}>57–71</span>
          {lanthanides.map((element, i) => (
            <button
              key={element.symbol}
              className={`${styles.elementCell} ${styles.fBlockCell}`}
              style={{
                backgroundColor: CATEGORY_COLORS['lanthanide'],
                opacity: getCompletionState(element.symbol) === 'locked' ? 0.3 : 1,
              }}
              onClick={() => handleElementClick(element.symbol)}
              title={`${element.name} (Z=${element.atomicNumber})`}
            >
              <span className={styles.atomicNumber}>{element.atomicNumber}</span>
              <span className={styles.elementSymbolCell}>{element.symbol}</span>
            </button>
          ))}
        </div>
        <div className={styles.fBlockRow}>
          <span className={styles.fBlockPeriodLabel}>89–103</span>
          {actinides.map(element => (
            <button
              key={element.symbol}
              className={`${styles.elementCell} ${styles.fBlockCell}`}
              style={{
                backgroundColor: CATEGORY_COLORS['actinide'],
                opacity: getCompletionState(element.symbol) === 'locked' ? 0.3 : 1,
              }}
              onClick={() => handleElementClick(element.symbol)}
              title={`${element.name} (Z=${element.atomicNumber})`}
            >
              <span className={styles.atomicNumber}>{element.atomicNumber}</span>
              <span className={styles.elementSymbolCell}>{element.symbol}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Category legend */}
      <div className={styles.categoryLegend}>
        {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
          <span key={cat} className={styles.catLegendItem}>
            <span className={styles.catSwatch} style={{ backgroundColor: color }} />
            {cat.replace(/-/g, ' ')}
          </span>
        ))}
      </div>
    </div>
  )
}
