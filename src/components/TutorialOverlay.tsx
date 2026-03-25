import { useGameState } from '../hooks/useGameState'
import styles from '../styles/HUD.module.css'

export function TutorialOverlay() {
  const {
    gameState,
    currentLevelConfig,
    currentTutorialPrompt,
    hasMorePrompts,
    advanceTutorialPrompt,
    tutorialPromptIndex,
  } = useGameState()

  if (!gameState || gameState.gameMode !== 'tutorial') return null
  if (!currentTutorialPrompt) return null
  if (tutorialPromptIndex >= (currentLevelConfig?.tutorialPrompts.length ?? 0)) return null

  return (
    <div className={styles.tutorialOverlay}>
      <div className={styles.tutorialBubble}>
        <div className={styles.tutorialAtomIcon}>⚛</div>
        <div className={styles.tutorialText}>{currentTutorialPrompt}</div>
        {hasMorePrompts ? (
          <button
            className={styles.tutorialNext}
            onClick={advanceTutorialPrompt}
          >
            Next →
          </button>
        ) : (
          <button
            className={styles.tutorialNext}
            onClick={advanceTutorialPrompt}
          >
            Got it!
          </button>
        )}
        <div className={styles.tutorialProgress}>
          {Array.from({ length: currentLevelConfig?.tutorialPrompts.length ?? 0 }).map((_, i) => (
            <span
              key={i}
              className={i === tutorialPromptIndex ? styles.tutorialDotActive : styles.tutorialDot}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
