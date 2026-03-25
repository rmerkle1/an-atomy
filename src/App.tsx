import { BrowserRouter, Routes, Route, useParams, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { MainMenu } from './components/MainMenu'
import { PeriodicTableMap } from './components/PeriodicTableMap'
import { GameBoard } from './components/GameBoard'
import { HUD } from './components/HUD'
import { LobbyScreen } from './components/LobbyScreen'
import { DailyPuzzle } from './components/DailyPuzzle'
import { DecayModal } from './components/DecayModal'
import { TutorialOverlay } from './components/TutorialOverlay'
import { useGameState } from './hooks/useGameState'
import { TUTORIAL_LEVELS } from './data/levels'
import { ELEMENTS } from './data/elements'
import { buildFreeDeck } from './game/deckBuilder'

// ── Game Page ─────────────────────────────────────────────────────────────────

function GamePage() {
  const { elementSymbol } = useParams<{ elementSymbol: string }>()
  const navigate = useNavigate()
  const { initFreePlay, gameState } = useGameState()

  useEffect(() => {
    if (!elementSymbol) return
    if (!gameState || gameState.currentElement?.symbol !== elementSymbol) {
      initFreePlay(elementSymbol)
    }
  }, [elementSymbol])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#0a0a1a' }}>
      <div style={{ display: 'flex', flexDirection: 'column', width: 800 }}>
        {/* Back nav */}
        <div style={{ display: 'flex', gap: 8, padding: '8px 0', alignItems: 'center' }}>
          <button
            onClick={() => navigate('/play')}
            style={{ color: '#8899aa', fontFamily: 'monospace', fontSize: 12, border: '1px solid #1a2a4a', borderRadius: 4, padding: '4px 8px', cursor: 'pointer', background: 'none' }}
          >
            ← Elements
          </button>
          {gameState?.currentElement && (
            <span style={{ color: '#4fc3f7', fontFamily: 'monospace', fontSize: 12 }}>
              Building {gameState.currentElement.name} ({elementSymbol})
            </span>
          )}
        </div>

        {/* Phaser canvas */}
        <GameBoard width={800} height={480} />

        {/* HUD below canvas */}
        <HUD />
      </div>

      {/* Overlays */}
      <DecayModal />
      <TutorialOverlay />
    </div>
  )
}

// ── Tutorial Page ─────────────────────────────────────────────────────────────

function TutorialPage() {
  const navigate = useNavigate()
  const { initLevel, gameState, resetGame } = useGameState()

  useEffect(() => {
    const level = TUTORIAL_LEVELS[0]
    initLevel(level)
  }, [])

  // Advance through tutorial levels when one completes
  useEffect(() => {
    if (!gameState?.isComplete) return
    const currentIdx = TUTORIAL_LEVELS.findIndex(
      l => l.element.symbol === gameState.currentElement?.symbol
    )
    const nextLevel = TUTORIAL_LEVELS[currentIdx + 1]

    if (nextLevel) {
      const timer = setTimeout(() => initLevel(nextLevel), 2000)
      return () => clearTimeout(timer)
    } else {
      // Tutorial complete — go to free play
      const timer = setTimeout(() => {
        resetGame()
        navigate('/play')
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [gameState?.isComplete, gameState?.currentElement?.symbol])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#0a0a1a' }}>
      <div style={{ display: 'flex', flexDirection: 'column', width: 800 }}>
        <div style={{ display: 'flex', gap: 8, padding: '8px 0', alignItems: 'center' }}>
          <button
            onClick={() => { resetGame(); navigate('/') }}
            style={{ color: '#8899aa', fontFamily: 'monospace', fontSize: 12, border: '1px solid #1a2a4a', borderRadius: 4, padding: '4px 8px', cursor: 'pointer', background: 'none' }}
          >
            ← Menu
          </button>
          <span style={{ color: '#4fc3f7', fontFamily: 'monospace', fontSize: 12 }}>
            Tutorial — Level {TUTORIAL_LEVELS.findIndex(l => l.element.symbol === gameState?.currentElement?.symbol) + 1}/10
          </span>
        </div>

        <GameBoard width={800} height={480} />
        <HUD />
      </div>

      <DecayModal />
      <TutorialOverlay />
    </div>
  )
}

// ── Router ────────────────────────────────────────────────────────────────────

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<MainMenu />} />
      <Route path="/play" element={<PeriodicTableMap />} />
      <Route path="/tutorial" element={<TutorialPage />} />
      <Route path="/game/:elementSymbol" element={<GamePage />} />
      <Route path="/daily" element={<DailyPuzzle />} />
      <Route path="/multiplayer" element={<LobbyScreen />} />
    </Routes>
  )
}

export function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
