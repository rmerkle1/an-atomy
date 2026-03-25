# An Atomy

**Learn atomic structure by building atoms — one card at a time.**

An Atomy is an educational card-based puzzle game that teaches chemistry through strategic gameplay. Players synthesize target atoms by adding protons, neutrons, and electrons while managing nuclear stability, electron configurations, and ionic charge balance.

---

## Features

- **Tutorial mode** — 10 guided levels walking through Hydrogen through Neon, each teaching a new concept (protons define elements, neutrons stabilize, electron shells, ionic charge, Aufbau exceptions, and more)
- **Free Play** — The full periodic table as a level selector. Build any of 118 elements at your own pace
- **Daily Puzzle** — A new curated challenge each day, same for all players worldwide
- **Multiplayer** — Up to 4 players in simultaneous draft-and-pass card mode (like 7 Wonders), complete with interference cards, lobbies, and game codes
- **Real atomic physics** — Stability math based on actual nuclear binding energy principles (N/Z ratio, Coulomb repulsion, Aufbau principle, Chromium/Copper exceptions, and more)

---

## Getting Started

```bash
git clone https://github.com/your-username/an-atomy.git
cd an-atomy

# Install frontend dependencies
npm install

# Start the Vite dev server
npm run dev

# In a second terminal — start the multiplayer server
npm run server

# Or run both concurrently
npm run dev:all
```

Open http://localhost:5173 in your browser.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend framework | React 18 + TypeScript |
| Build tool | Vite 6 |
| Game engine | Phaser 3 (canvas renderer) |
| State management | Zustand |
| Routing | React Router v6 |
| Multiplayer | Node.js + Express + Socket.io |
| Styling | CSS Modules |
| Package manager | npm |

---

## Project Structure

```
an_atomy/
├── src/
│   ├── types/game.ts          — All TypeScript interfaces
│   ├── data/
│   │   ├── elements.ts        — All 118 elements
│   │   ├── cards.ts           — All card definitions (Tiers 1–5 + Wild)
│   │   └── levels.ts          — Tutorial level configurations
│   ├── game/
│   │   ├── gameEngine.ts      — Pure stability math functions
│   │   ├── deckBuilder.ts     — Deck generation logic
│   │   └── electronConfig.ts  — Aufbau principle + exceptions
│   ├── scenes/
│   │   ├── BootScene.ts       — Phaser asset loading scene
│   │   ├── GameScene.ts       — Atom visualization (nucleus + shells)
│   │   └── UIScene.ts         — Decay card flip animation overlay
│   ├── components/
│   │   ├── GameBoard.tsx      — Phaser canvas wrapper
│   │   ├── HUD.tsx            — Full game HUD (cards + meters)
│   │   ├── StabilityMeter.tsx — Left-column stability bar
│   │   ├── ProgressPanel.tsx  — Right-column progress tracker
│   │   ├── CardComponent.tsx  — Individual card UI
│   │   ├── CompanionPanel.tsx — Companion atom controls
│   │   ├── DecayModal.tsx     — Animated decay check overlay
│   │   ├── MainMenu.tsx       — Title screen
│   │   ├── PeriodicTableMap.tsx — Level selector
│   │   ├── LobbyScreen.tsx    — Multiplayer lobby
│   │   ├── DailyPuzzle.tsx    — Daily challenge screen
│   │   └── TutorialOverlay.tsx — Tutorial prompt bubbles
│   ├── store/gameStore.ts     — Zustand game state store
│   ├── hooks/
│   │   ├── useGameState.ts    — Game state hook
│   │   └── useSocket.ts       — Multiplayer socket hook
│   └── App.tsx                — React Router setup
└── server/
    ├── index.js               — Express + Socket.io server
    └── gameServer.js          — Multiplayer game state management
```

---

## Game Mechanics

### Stability Pool

Every atom has a stability pool sized at `(mass number × 3) + 20`. It's displayed as a color-coded percentage bar — the underlying numbers are hidden to keep focus on strategy.

- **Proton cost:** `2 + floor(current_protons / 4)` per proton — scales up as the nucleus grows
- **Neutron benefit:** Neutrons near the ideal N/Z ratio restore stability. The ideal ratio is 1:1 for Z≤20 and grows toward ~1.4 at Krypton
- **Electrons:** Free to place (Aufbau auto-fill), but completing subshells (s, p, d) grants stability bonuses. Ionic charge imbalance costs stability
- **End-of-turn drain:** If the neutron-to-proton ratio deviates too far, stability drains every turn

### Decay Checks

When stability falls below 50%, each turn triggers a Decay Check — a face-down card flips to reveal the result:
- **25–50%:** ~35–60% chance of beta decay, neutron emission, or electron ejection
- **Below 25%:** Decay is guaranteed every turn; 30% chance of Double Decay

### Electron Configuration

Electrons fill automatically following the Aufbau principle (1s → 2s → 2p → 3s → 3p → 4s → 3d → ...). The system handles real exceptions: Chromium (3d⁵ 4s¹), Copper (3d¹⁰ 4s¹), Molybdenum, Silver, Gold, and Platinum.

### Card Tiers

| Tier | Description | Unlocks |
|------|-------------|---------|
| 1 | Single/pair/cluster particles | Level 1 |
| 2 | Bundles, Stabilizer Pulse, Decay Shield | Level 5 (Boron) |
| 3 | Beta Conversion, Neutron Capture, Isotope Shift | Row 3 (Na) |
| 4 | Proton Barrage, Nuclear Resonance, Stellar Forge | Row 4 d-block (Sc) |
| 5 | Interference cards (multiplayer only) | Always |
| Wild | Mystery Particle, Antimatter Pulse, Energy Well, Half-Life Timer | Any tier |

---

## Contributing

Contributions are welcome! Areas that would benefit from help:

- Adding persistent progress tracking (localStorage or backend)
- Leaderboard for daily puzzles
- Mobile/touch layout (the game is designed for landscape orientation)
- Sound effects and music
- Additional element variant puzzles (isotopes, ions)
- Accessibility improvements

Please open an issue before starting a large feature.

---

## License

MIT © An Atomy Contributors
