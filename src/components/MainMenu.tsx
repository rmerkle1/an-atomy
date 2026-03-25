import { useNavigate } from 'react-router-dom'
import styles from '../styles/MainMenu.module.css'

export function MainMenu() {
  const navigate = useNavigate()

  return (
    <div className={styles.menuRoot}>
      {/* Background particle effects */}
      <div className={styles.particleField}>
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className={styles.floatingParticle}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
              width: `${4 + Math.random() * 6}px`,
              height: `${4 + Math.random() * 6}px`,
              backgroundColor: ['#e74c3c', '#95a5a6', '#4fc3f7'][Math.floor(Math.random() * 3)],
            }}
          />
        ))}
      </div>

      <div className={styles.menuContent}>
        {/* Title */}
        <div className={styles.titleBlock}>
          <h1 className={styles.titleMain}>An Atomy</h1>
          <p className={styles.titleTagline}>
            Learn atomic structure by building atoms — one card at a time.
          </p>
        </div>

        {/* Decorative atom graphic */}
        <div className={styles.atomDecor}>
          <div className={styles.nucleus}>
            <span className={styles.nucleusLabel}>⚛</span>
          </div>
          <div className={styles.orbit1} />
          <div className={styles.orbit2} />
          <div className={styles.orbit3} />
        </div>

        {/* Menu buttons */}
        <nav className={styles.menuButtons}>
          <button
            className={`${styles.menuButton} ${styles.buttonPrimary}`}
            onClick={() => navigate('/tutorial')}
          >
            <span className={styles.buttonIcon}>▶</span>
            Tutorial
            <span className={styles.buttonSub}>Start with Hydrogen</span>
          </button>

          <button
            className={`${styles.menuButton} ${styles.buttonSecondary}`}
            onClick={() => navigate('/play')}
          >
            <span className={styles.buttonIcon}>⚛</span>
            Free Play
            <span className={styles.buttonSub}>Choose any element</span>
          </button>

          <button
            className={`${styles.menuButton} ${styles.buttonSecondary}`}
            onClick={() => navigate('/daily')}
          >
            <span className={styles.buttonIcon}>📅</span>
            Daily Puzzle
            <span className={styles.buttonSub}>Today's challenge</span>
          </button>

          <button
            className={`${styles.menuButton} ${styles.buttonSecondary}`}
            onClick={() => navigate('/multiplayer')}
          >
            <span className={styles.buttonIcon}>👥</span>
            Multiplayer
            <span className={styles.buttonSub}>Up to 4 players</span>
          </button>
        </nav>

        <p className={styles.version}>v0.1.0 — An Atomy</p>
      </div>
    </div>
  )
}
