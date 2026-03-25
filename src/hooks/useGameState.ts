import { useGameStore } from '../store/gameStore'

export function useGameState() {
  const {
    gameState,
    currentLevelConfig,
    isDecayModalOpen,
    tutorialPromptIndex,
    initLevel,
    initFreePlay,
    playCard,
    useCompanion,
    discardCard,
    revealDecayModal,
    hideDecayModal,
    advanceTutorialPrompt,
    resetGame,
    setGameMode,
  } = useGameStore()

  const currentTutorialPrompt =
    currentLevelConfig?.tutorialPrompts[tutorialPromptIndex] ?? null

  const hasMorePrompts =
    currentLevelConfig !== null &&
    tutorialPromptIndex < (currentLevelConfig.tutorialPrompts.length - 1)

  const stabilityZone =
    !gameState
      ? 'stable'
      : gameState.stabilityCurrentPercent >= 75
      ? 'stable'
      : gameState.stabilityCurrentPercent >= 50
      ? 'excited'
      : gameState.stabilityCurrentPercent >= 25
      ? 'decay-risk'
      : 'critical'

  const canUseCompanion =
    !!gameState &&
    gameState.companionUsesRemaining > 0 &&
    !gameState.isComplete &&
    !gameState.isFailed

  const canDiscard =
    !!gameState &&
    gameState.gameMode !== 'tutorial' &&
    !gameState.isComplete &&
    !gameState.isFailed

  const canPlayCard = (index: number): boolean => {
    if (!gameState) return false
    if (gameState.isComplete || gameState.isFailed) return false
    if (index < 0 || index >= gameState.hand.length) return false
    const card = gameState.hand[index]
    // Neutron Capture only playable below 50%
    if (card.specialEffect === 'neutron_capture' && gameState.stabilityCurrentPercent >= 50) return false
    return true
  }

  return {
    gameState,
    currentLevelConfig,
    isDecayModalOpen,
    tutorialPromptIndex,
    currentTutorialPrompt,
    hasMorePrompts,
    stabilityZone,
    canUseCompanion,
    canDiscard,
    canPlayCard,
    initLevel,
    initFreePlay,
    playCard,
    useCompanion,
    discardCard,
    revealDecayModal,
    hideDecayModal,
    advanceTutorialPrompt,
    resetGame,
    setGameMode,
  }
}
