import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSocket } from '../hooks/useSocket'
import styles from '../styles/MainMenu.module.css'

export function LobbyScreen() {
  const navigate = useNavigate()
  const {
    isConnected,
    lobbyState,
    myPlayerId,
    error,
    createLobby,
    joinLobby,
    startGame,
  } = useSocket()

  const [playerName, setPlayerName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [view, setView] = useState<'main' | 'create' | 'join' | 'lobby'>('main')

  useEffect(() => {
    if (lobbyState) {
      setView('lobby')
    }
  }, [lobbyState])

  const handleCreate = () => {
    if (!playerName.trim()) return
    createLobby(playerName.trim())
  }

  const handleJoin = () => {
    if (!playerName.trim() || !joinCode.trim()) return
    joinLobby(joinCode.trim().toUpperCase(), playerName.trim())
  }

  const isHost = lobbyState?.hostId === myPlayerId
  const canStart = isHost && (lobbyState?.players.length ?? 0) >= 2

  return (
    <div className={styles.menuRoot}>
      <div className={styles.menuContent}>
        <button className={styles.backButton} onClick={() => navigate('/')}>
          ← Back
        </button>

        <h1 className={styles.titleMain} style={{ fontSize: '2rem' }}>Multiplayer</h1>

        {!isConnected && (
          <div className={styles.errorBanner}>
            {error ?? 'Connecting to server...'}
          </div>
        )}

        {view === 'main' && (
          <div className={styles.lobbyActions}>
            <input
              className={styles.lobbyInput}
              placeholder="Your name"
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              maxLength={20}
            />
            <button
              className={`${styles.menuButton} ${styles.buttonPrimary}`}
              onClick={() => setView('create')}
              disabled={!isConnected}
            >
              Create Game
            </button>
            <button
              className={`${styles.menuButton} ${styles.buttonSecondary}`}
              onClick={() => setView('join')}
              disabled={!isConnected}
            >
              Join Game
            </button>
          </div>
        )}

        {view === 'create' && (
          <div className={styles.lobbyActions}>
            <input
              className={styles.lobbyInput}
              placeholder="Your name"
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              maxLength={20}
            />
            <button
              className={`${styles.menuButton} ${styles.buttonPrimary}`}
              onClick={handleCreate}
              disabled={!isConnected || !playerName.trim()}
            >
              Create Lobby
            </button>
            <button className={styles.backLink} onClick={() => setView('main')}>
              ← Back
            </button>
          </div>
        )}

        {view === 'join' && (
          <div className={styles.lobbyActions}>
            <input
              className={styles.lobbyInput}
              placeholder="Your name"
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              maxLength={20}
            />
            <input
              className={styles.lobbyInput}
              placeholder="Game code (e.g. ATOM-7K3F)"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value)}
              maxLength={9}
              style={{ textTransform: 'uppercase' }}
            />
            <button
              className={`${styles.menuButton} ${styles.buttonPrimary}`}
              onClick={handleJoin}
              disabled={!isConnected || !playerName.trim() || !joinCode.trim()}
            >
              Join Lobby
            </button>
            <button className={styles.backLink} onClick={() => setView('main')}>
              ← Back
            </button>
          </div>
        )}

        {view === 'lobby' && lobbyState && (
          <div className={styles.lobbyRoom}>
            <div className={styles.gameCode}>
              <span className={styles.gameCodeLabel}>Game Code:</span>
              <span className={styles.gameCodeValue}>{lobbyState.gameCode}</span>
              <span className={styles.gameCodeHint}>Share this with friends!</span>
            </div>

            <div className={styles.playerList}>
              <h3 className={styles.playerListTitle}>
                Players ({lobbyState.players.length}/4)
              </h3>
              {lobbyState.players.map(player => (
                <div key={player.id} className={styles.playerRow}>
                  <span className={styles.playerName}>{player.name}</span>
                  {player.id === lobbyState.hostId && (
                    <span className={styles.hostBadge}>HOST</span>
                  )}
                  {player.id === myPlayerId && (
                    <span className={styles.youBadge}>YOU</span>
                  )}
                  <span className={styles.readyBadge}>
                    {player.isReady ? '✓ Ready' : '...'}
                  </span>
                </div>
              ))}
            </div>

            {isHost ? (
              <button
                className={`${styles.menuButton} ${styles.buttonPrimary}`}
                onClick={startGame}
                disabled={!canStart}
              >
                {canStart ? 'Start Game' : `Waiting for players... (${lobbyState.players.length}/2)`}
              </button>
            ) : (
              <div className={styles.waitingMessage}>
                Waiting for host to start...
              </div>
            )}
          </div>
        )}

        {error && (
          <div className={styles.errorBanner}>{error}</div>
        )}
      </div>
    </div>
  )
}
