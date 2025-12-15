set define off;

create table dart_app_files (
  filename varchar2(255) primary key,
  mime_type varchar2(64) not null,
  content clob not null
);

-- remove existing rows for idempotent loading
delete from dart_app_files where filename in ('index.html', 'styles.css', 'app.js');

insert into dart_app_files (filename, mime_type, content)
values ('index.html', 'text/html', q'~<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="theme-color" content="#0c0c0f" />
  <title>Dart Board - Free Scoreboard</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <main class="app-shell">
    <section id="start-screen" class="panel panel--elevated">
      <div class="branding">
        <p class="eyebrow">Start a free match</p>
        <h1>Dart Board</h1>
        <p class="lede">Pick a game, name your players, and jump straight into scoring.</p>
      </div>

      <div class="start-grid">
        <div class="stack">
          <p class="muted">Choose a game</p>
          <div id="game-picker" class="game-picker" role="group" aria-label="Game type">
            <button type="button" data-game="301">301</button>
            <button type="button" data-game="501" class="active">501</button>
            <button type="button" data-game="701">701</button>
            <button type="button" data-game="cricket">Cricket</button>
          </div>
          <small class="muted">301 requires double-in and double-out. 501/701 require double-out. Cricket uses standard marks and points.</small>
        </div>

        <div class="stack">
          <label class="stacked">Player 1 name
            <input id="player-one" placeholder="Home" />
          </label>
          <label class="stacked">Player 2 name
            <input id="player-two" placeholder="Away" />
          </label>
          <button id="begin-match" class="primary">Begin match</button>
          <p id="start-feedback" class="status muted" role="status"></p>
        </div>
      </div>
    </section>

    <section id="score-screen" class="panel" hidden>
      <div class="score-topbar">
        <button type="button" id="home-button" class="ghost">Home</button>
      </div>
      <header class="score-header">
        <div class="side side--left">
          <p class="muted">Home</p>
          <h2 id="left-name">Player 1</h2>
          <p id="left-score" class="score-value">0</p>
        </div>
        <div class="turn-indicator" id="turn-indicator">Waiting to start</div>
        <div class="side side--right">
          <p class="muted">Away</p>
          <h2 id="right-name">Player 2</h2>
          <p id="right-score" class="score-value">0</p>
        </div>
      </header>

      <div id="x01-board" class="board" hidden>
        <div class="x01-grid">
          <div class="stat">
            <p class="muted">Last visit</p>
            <p id="last-left">–</p>
          </div>
          <div class="stat">
            <p class="muted">Status</p>
            <p id="status-text">Leg on</p>
          </div>
          <div class="stat">
            <p class="muted">Last visit</p>
            <p id="last-right">–</p>
          </div>
        </div>
      </div>

      <div id="cricket-board" class="board" hidden>
        <div class="cricket-table" id="cricket-table"></div>
      </div>

      <div class="input-bar">
        <div id="x01-input" class="pad" hidden>
          <div class="pad__header">
            <div>
              <p class="muted small">Enter up to three darts, then confirm</p>
              <p id="dart-selection" class="badge">No darts selected</p>
            </div>
            <div class="toggle-group" role="group" aria-label="Multiplier">
              <button type="button" class="toggle active" data-mult="1">S</button>
              <button type="button" class="toggle" data-mult="2">D</button>
              <button type="button" class="toggle" data-mult="3">T</button>
            </div>
          </div>
          <div class="pad-grid" id="dart-grid"></div>
        </div>

        <div id="cricket-input" class="pad" hidden>
          <div class="pad__header">
            <div>
              <p class="muted small">Tap numbers or D/T to queue hits, then confirm</p>
              <p id="cricket-selection" class="badge">No hits queued</p>
            </div>
          </div>
          <p class="muted small">First tap draws a slash, second completes an X, third circles it closed.</p>
        </div>

        <div class="pad-actions global-actions">
          <button type="button" id="clear-darts" class="ghost">Clear</button>
          <button type="button" id="undo-dart" class="ghost">Undo</button>
          <button type="button" id="record-visit" class="primary">Confirm</button>
        </div>
      </div>
    </section>
  </main>

  <script src="app.js"></script>
</body>
</html>
~');

insert into dart_app_files (filename, mime_type, content)
values ('styles.css', 'text/css', q'~:root {
  --bg: #0c0c0f;
  --panel: #16161b;
  --panel-strong: #1d1d24;
  --accent: #c53030;
  --accent-strong: #ff4d4d;
  --text: #f7f7fa;
  --muted: #b5b5c1;
  --border: #2a2a32;
  --shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
  font-family: "Inter", system-ui, -apple-system, sans-serif;
  color-scheme: dark;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  min-height: 100vh;
  background: radial-gradient(circle at 25% 20%, rgba(197, 48, 48, 0.2), transparent 35%),
    radial-gradient(circle at 70% 0%, rgba(255, 77, 77, 0.15), transparent 30%),
    var(--bg);
  color: var(--text);
  -webkit-font-smoothing: antialiased;
  -webkit-text-size-adjust: 100%;
}

.app-shell {
  min-height: 100vh;
  display: flex;
  align-items: stretch;
  justify-content: center;
  padding: calc(1rem + env(safe-area-inset-top)) calc(1rem + env(safe-area-inset-right))
    calc(1rem + env(safe-area-inset-bottom)) calc(1rem + env(safe-area-inset-left));
}

.panel {
  width: min(1100px, 100%);
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 18px;
  padding: 1.5rem;
  box-shadow: var(--shadow);
}

.panel--elevated {
  background: linear-gradient(135deg, rgba(255, 77, 77, 0.08), rgba(197, 48, 48, 0.12)), var(--panel);
}

.branding h1 { margin: 0 0 0.35rem; font-size: clamp(2.1rem, 5vw, 3rem); }
.branding .lede { color: var(--muted); max-width: 720px; }
.eyebrow { text-transform: uppercase; letter-spacing: 0.12em; color: var(--accent-strong); font-weight: 800; font-size: 0.85rem; }

.start-grid {
  margin-top: 1rem;
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
}

.stack { display: flex; flex-direction: column; gap: 0.65rem; }
.stacked { display: flex; flex-direction: column; gap: 0.35rem; color: var(--text); }

input { font: inherit; background: var(--panel-strong); border: 1px solid var(--border); color: var(--text); border-radius: 12px; padding: 0.6rem 0.75rem; }
button {
  font: inherit;
  cursor: pointer;
  border: none;
  border-radius: 12px;
  padding: 0.7rem 1rem;
  font-weight: 800;
  min-height: 48px;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}
button:disabled { opacity: 0.5; cursor: not-allowed; }

input,
button {
  font-size: 16px;
}

.primary {
  background: linear-gradient(135deg, var(--accent) 0%, var(--accent-strong) 100%);
  color: #1a0f0f;
  box-shadow: 0 10px 40px rgba(255, 77, 77, 0.25);
}

.ghost { background: transparent; border: 1px solid var(--border); color: var(--text); }

.muted { color: var(--muted); }
.small { font-size: 0.9rem; }
.status { min-height: 1.25rem; }
.status-error { color: #ffb4b4; }

.game-picker {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 0.5rem;
}

.game-picker button {
  background: var(--panel-strong);
  border: 1px solid var(--border);
  color: var(--text);
}

.game-picker button.active {
  background: var(--accent);
  border-color: var(--accent-strong);
  color: #1a0f0f;
}

.score-header {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border);
}

.score-topbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 0.5rem;
}

.side h2 { margin: 0; font-size: 1.8rem; }
.side p { margin: 0; }

.turn-indicator {
  padding: 0.5rem 0.9rem;
  border-radius: 999px;
  background: rgba(255, 77, 77, 0.14);
  border: 1px solid rgba(255, 77, 77, 0.28);
  color: var(--text);
  font-weight: 700;
}

.board { margin: 1rem 0; }

.x01-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

.stat {
  background: var(--panel-strong);
  border: 1px dashed var(--border);
  border-radius: 12px;
  padding: 0.75rem;
  min-height: 70px;
}

.input-bar {
  margin-top: 1.5rem;
  position: sticky;
  bottom: 0;
  background: linear-gradient(180deg, transparent, rgba(12, 12, 15, 0.85));
  padding-bottom: env(safe-area-inset-bottom);
}

.pad {
  background: var(--panel-strong);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 0.75rem;
  display: grid;
  gap: 0.65rem;
}

.pad__header { display: flex; justify-content: space-between; align-items: center; gap: 0.75rem; flex-wrap: wrap; }

.pad-grid {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(62px, 1fr));
  gap: 0.4rem;
}

.pad-button {
  background: var(--panel);
  border: 1px solid var(--border);
  color: var(--text);
  padding: 0.6rem;
  border-radius: 10px;
}

.pad-button:hover { border-color: var(--accent); }

.pad-actions { display: flex; gap: 0.5rem; justify-content: flex-end; }

.global-actions {
  margin-top: 0.5rem;
  justify-content: flex-end;
}

.app-shell, .panel, .pad, .cricket-row, .cricket-header {
  transition: border-radius 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.toggle-group { display: inline-flex; border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
.toggle { background: transparent; border: none; padding: 0.4rem 0.9rem; color: var(--muted); }
.toggle.active { background: var(--accent); color: #1a0f0f; }

.badge {
  display: inline-block;
  padding: 0.2rem 0.55rem;
  border: 1px solid var(--border);
  border-radius: 10px;
  color: var(--muted);
  font-weight: 700;
}

.cricket-table {
  display: grid;
  gap: 0.4rem;
  background: var(--panel-strong);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 0.75rem;
}

.cricket-header, .cricket-row {
  display: grid;
  grid-template-columns: 1fr auto auto auto 1fr;
  align-items: center;
  gap: 0.35rem;
}

.cricket-header { font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); }

.cricket-row {
  background: var(--panel);
  border: 1px dashed var(--border);
  border-radius: 10px;
  padding: 0.35rem;
}

.cricket-number {
  background: var(--accent);
  color: #1a0f0f;
  font-weight: 900;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 10px;
}

.cricket-btn {
  background: #2b2b33;
  color: var(--text);
  border: 1px solid var(--border);
  padding: 0.6rem 0.9rem;
  border-radius: 10px;
}

.mark {
  text-align: center;
  font-weight: 800;
  display: flex;
  justify-content: center;
  align-items: center;
}

.mark-icon {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.35rem;
}

.mark-icon--empty {
  color: transparent;
}

.mark-icon--slash {
  color: var(--accent-strong);
  font-size: 1.6rem;
}

.mark-icon--x {
  color: var(--accent);
  font-size: 1.6rem;
}

.mark-icon--closed {
  background: var(--accent-strong);
  color: #0d0c10;
  border-radius: 50%;
}

.cricket-hint {
  text-align: center;
  color: var(--muted);
  background: var(--panel-strong);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 0.75rem;
}

@media (max-width: 960px) {
  .panel {
    border-radius: 0;
    min-height: calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom));
    box-shadow: none;
  }

  .app-shell {
    padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom)
      env(safe-area-inset-left);
  }

  .pad-actions { flex-wrap: wrap; }
  .pad-actions button { flex: 1; min-width: 110px; }
}

@media (max-width: 720px) {
  .pad-grid { grid-template-columns: repeat(4, minmax(64px, 1fr)); }
  .pad__header { align-items: flex-start; }
  .score-header { grid-template-columns: 1fr; text-align: center; }
  .turn-indicator { justify-self: center; }
}

@media (max-width: 640px) {
  .branding h1 { font-size: clamp(1.8rem, 7vw, 2.3rem); }
  .panel { padding: 1rem; }
  .pad { padding: 0.75rem; }
  .cricket-header, .cricket-row { grid-template-columns: repeat(5, 1fr); }
  .score-topbar { justify-content: space-between; align-items: center; }
  .score-topbar .ghost { width: 100%; }
}
~');

insert into dart_app_files (filename, mime_type, content)
values ('app.js', 'application/javascript', q'~const gamePicker = document.getElementById("game-picker");
const beginButton = document.getElementById("begin-match");
const startFeedback = document.getElementById("start-feedback");
const playerOneInput = document.getElementById("player-one");
const playerTwoInput = document.getElementById("player-two");
const startScreen = document.getElementById("start-screen");
const scoreScreen = document.getElementById("score-screen");
const leftName = document.getElementById("left-name");
const rightName = document.getElementById("right-name");
const leftScore = document.getElementById("left-score");
const rightScore = document.getElementById("right-score");
const turnIndicator = document.getElementById("turn-indicator");
const statusText = document.getElementById("status-text");
const lastLeft = document.getElementById("last-left");
const lastRight = document.getElementById("last-right");
const x01Board = document.getElementById("x01-board");
const cricketBoard = document.getElementById("cricket-board");
const cricketTable = document.getElementById("cricket-table");
const homeButton = document.getElementById("home-button");
const x01Input = document.getElementById("x01-input");
const cricketInput = document.getElementById("cricket-input");
const dartGrid = document.getElementById("dart-grid");
const dartSelection = document.getElementById("dart-selection");
const cricketSelection = document.getElementById("cricket-selection");
const clearDartsButton = document.getElementById("clear-darts");
const undoDartButton = document.getElementById("undo-dart");
const recordVisitButton = document.getElementById("record-visit");
const multiplierButtons = document.querySelectorAll(".toggle-group .toggle");

const targets = [20, 19, 18, 17, 16, 15, 25];
const dartNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 25];

const state = {
  gameType: "501",
  players: [],
  currentPlayer: 0,
  matchOver: false,
  currentDarts: [],
  activeMultiplier: 1,
  cricketDarts: 0,
  cricketSelections: [],
};

function pickGame(game) {
  state.gameType = game;
  gamePicker.querySelectorAll("button").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.game === game);
  });
}

function resetState() {
  state.players = [];
  state.currentPlayer = 0;
  state.matchOver = false;
  state.currentDarts = [];
  state.cricketDarts = 0;
  state.cricketSelections = [];
  state.activeMultiplier = 1;
  setActiveMultiplier(1);
  updateDartSelectionText();
  updateCricketSelectionText();
}

function goHome() {
  resetState();
  startScreen.hidden = false;
  scoreScreen.hidden = true;
  turnIndicator.textContent = "Waiting to start";
  statusText.textContent = "Leg on";
  dartSelection.textContent = "No darts selected";
  cricketSelection.textContent = "No hits queued";
  startFeedback.textContent = "";
  startFeedback.classList.remove("status-error");
}

function createPlayer(name) {
  if (state.gameType === "cricket") {
    return {
      name,
      points: 0,
      marks: targets.reduce((acc, t) => ({ ...acc, [t]: 0 }), {}),
      lastHits: "–",
      status: "",
    };
  }

  const startScore = Number(state.gameType);
  return {
    name,
    startScore,
    score: startScore,
    isIn: state.gameType !== "301",
    status: "",
    lastVisit: "–",
  };
}

function beginMatch() {
  const p1 = playerOneInput.value.trim() || "Home";
  const p2 = playerTwoInput.value.trim() || "Away";

  if (!state.gameType) {
    startFeedback.textContent = "Choose a game to begin.";
    startFeedback.classList.add("status-error");
    return;
  }

  startFeedback.textContent = "";
  startFeedback.classList.remove("status-error");
  resetState();
  state.players = [createPlayer(p1), createPlayer(p2)];
  leftName.textContent = p1;
  rightName.textContent = p2;
  turnIndicator.textContent = `${state.players[state.currentPlayer].name}'s turn`;
  statusText.textContent = "Leg on";
  lastLeft.textContent = "–";
  lastRight.textContent = "–";

  render();

  startScreen.hidden = true;
  scoreScreen.hidden = false;
}

function updateDartSelectionText() {
  if (!dartSelection) return;
  if (!state.currentDarts.length) {
    dartSelection.textContent = "No darts selected";
    return;
  }

  const total = state.currentDarts.reduce((sum, dart) => sum + dart.value * dart.multiplier, 0);
  const summary = state.currentDarts
    .map((dart) => {
      const prefix = dart.multiplier === 1 ? "" : dart.multiplier === 2 ? "D " : "T ";
      return `${prefix}${dart.value === 25 ? "Bull" : dart.value}`;
    })
    .join(" + ");
  dartSelection.textContent = `${summary} = ${total}`;
}

function updateCricketSelectionText() {
  if (!cricketSelection) return;
  if (!state.cricketSelections.length) {
    cricketSelection.textContent = "No hits queued";
    return;
  }

  const summary = state.cricketSelections
    .map(({ target, hits }) => `${hits === 1 ? "S" : hits === 2 ? "D" : "T"} ${target === 25 ? "Bull" : target}`)
    .join(" • ");
  cricketSelection.textContent = `${summary} (${state.cricketDarts}/3 darts)`;
}

function renderMarkIcons(count) {
  if (count <= 0) return '<span class="mark-icon mark-icon--empty">&nbsp;</span>';
  if (count === 1) return '<span class="mark-icon mark-icon--slash">/</span>';
  if (count === 2) return '<span class="mark-icon mark-icon--x">✕</span>';
  return '<span class="mark-icon mark-icon--closed">Ⓧ</span>';
}

function setActiveMultiplier(multiplier) {
  state.activeMultiplier = multiplier;
  multiplierButtons.forEach((btn) => {
    btn.classList.toggle("active", Number(btn.dataset.mult) === multiplier);
  });
}

function buildDartGrid() {
  dartGrid.innerHTML = dartNumbers
    .map((value) => {
      const label = value === 25 ? "Bull" : value;
      return `<button type="button" class="pad-button" data-value="${value}">${label}</button>`;
    })
    .join("");
}

function handleDartButtonClick(value) {
  if (state.gameType === "cricket" || state.matchOver) return;
  if (state.currentDarts.length >= 3) return;

  state.currentDarts.push({ value, multiplier: state.activeMultiplier });
  updateDartSelectionText();
}

function clearCurrentDarts() {
  state.currentDarts = [];
  state.cricketSelections = [];
  state.cricketDarts = 0;
  updateDartSelectionText();
  updateCricketSelectionText();
  if (state.gameType === "cricket") {
    render();
  }
}

function undoLastEntry() {
  if (state.gameType === "cricket") {
    const removed = state.cricketSelections.pop();
    if (removed) {
      state.cricketDarts = Math.max(0, state.cricketDarts - 1);
    }
    updateCricketSelectionText();
    render();
    return;
  }

  state.currentDarts.pop();
  updateDartSelectionText();
}

function bust(player, reason) {
  player.status = "Bust";
  statusText.textContent = `${player.name}: ${reason}`;
}

function markWin(player) {
  state.matchOver = true;
  player.status = "Winner";
  statusText.textContent = `${player.name} wins the leg!`;
  turnIndicator.textContent = "Match over";
}

function advancePlayer() {
  state.currentPlayer = (state.currentPlayer + 1) % state.players.length;
  turnIndicator.textContent = `${state.players[state.currentPlayer].name}'s turn`;
}

function handleX01Visit() {
  const darts = [...state.currentDarts];
  if (!darts.length) return;

  const score = darts.reduce((sum, dart) => sum + dart.value * dart.multiplier, 0);
  const doubleInAchieved = darts.some((dart) => dart.multiplier === 2);
  const finalDartDouble = darts[darts.length - 1].multiplier === 2;
  const player = state.players[state.currentPlayer];
  player.status = "";

  if (!player.isIn && state.gameType === "301") {
    if (doubleInAchieved) {
      player.isIn = true;
    } else {
      bust(player, "double-in required");
      player.lastVisit = score;
      render();
      advancePlayer();
      return;
    }
  }

  const nextScore = player.score - score;

  if (nextScore < 0) {
    bust(player, "bust below zero");
  } else if (nextScore === 0) {
    if (finalDartDouble) {
      player.score = 0;
      markWin(player);
    } else {
      bust(player, "checkout must be on a double");
    }
  } else {
    player.score = nextScore;
    statusText.textContent = `${player.name} scored ${score}. ${nextScore} remaining.`;
  }

  player.lastVisit = score;
  render();
  if (!state.matchOver) advancePlayer();
}

function recordVisit() {
  if (state.gameType !== "cricket") {
    handleX01Visit();
    clearCurrentDarts();
    return;
  }

  applyCricketSelections();
}

function allTargetsClosed(player) {
  return targets.every((t) => player.marks[t] >= 3);
}

function queueCricketHit(target, hits) {
  if (state.gameType !== "cricket" || state.matchOver) return;
  if (state.cricketDarts >= 3) return;

  state.cricketSelections.push({ target, hits });
  state.cricketDarts += 1;
  updateCricketSelectionText();
  render();
}

function getProjectedMarks(playerIndex) {
  const player = state.players[playerIndex];
  const marks = { ...player.marks };

  if (state.gameType === "cricket" && !state.matchOver && playerIndex === state.currentPlayer) {
    state.cricketSelections.forEach(({ target, hits }) => {
      marks[target] = Math.min(3, (marks[target] || 0) + hits);
    });
  }

  return marks;
}

function applyCricketHit(player, target, hits) {
  const previous = player.marks[target];
  const projected = previous + hits;
  const newMarks = Math.min(3, projected);
  const closedByOthers = state.players
    .filter((_, idx) => idx !== state.currentPlayer)
    .every((p) => p.marks[target] >= 3);

  let scoringHits = Math.max(0, projected - 3);
  if (closedByOthers) scoringHits = 0;

  player.marks[target] = newMarks;
  const value = target === 25 ? 25 : target;
  if (player.marks[target] >= 3) {
    player.points += scoringHits * value;
  }
}

function applyCricketSelections() {
  if (!state.cricketSelections.length || state.matchOver) return;

  const player = state.players[state.currentPlayer];
  player.status = "";

  state.cricketSelections.forEach(({ target, hits }) => {
    applyCricketHit(player, target, hits);
  });

  player.lastHits = `${state.cricketSelections
    .map(({ target, hits }) => `${hits}×${target === 25 ? "Bull" : target}`)
    .join(" + ")}`;
  statusText.textContent = `${player.name} hits ${player.lastHits}.`;

  const closedAll = allTargetsClosed(player);
  const opponentPoints = state.players[state.currentPlayer === 0 ? 1 : 0].points;
  if (closedAll && player.points >= opponentPoints) {
    markWin(player);
  }

  render();
  state.cricketSelections = [];
  state.cricketDarts = 0;
  updateCricketSelectionText();
  if (!state.matchOver) advancePlayer();
}

function renderCricketTable() {
  const [p1, p2] = state.players;
  const projectedP1 = getProjectedMarks(0);
  const projectedP2 = getProjectedMarks(1);
  const rows = targets
    .map((target) => {
      const label = target === 25 ? "B" : target;
      const p1Marks = Math.min(3, projectedP1[target]);
      const p2Marks = Math.min(3, projectedP2[target]);
      return `
        <div class="cricket-row" data-target="${target}">
          <div class="mark" data-player="0">${renderMarkIcons(p1Marks)}</div>
          <button class="cricket-btn" data-hits="2" aria-label="Double ${label}">D</button>
          <button class="cricket-number" data-hits="1">${label}</button>
          <button class="cricket-btn" data-hits="3" aria-label="Triple ${label}">T</button>
          <div class="mark" data-player="1">${renderMarkIcons(p2Marks)}</div>
        </div>
      `;
    })
    .join("");

  cricketTable.innerHTML = `
    <div class="cricket-header">
      <div>${state.players[0].name}</div>
      <div></div>
      <div>Number</div>
      <div></div>
      <div>${state.players[1].name}</div>
    </div>
    ${rows}
  `;
}

function render() {
  const [p1, p2] = state.players;
  if (!p1 || !p2) return;

  const isCricket = state.gameType === "cricket";
  x01Board.hidden = isCricket;
  x01Input.hidden = isCricket;
  cricketBoard.hidden = !isCricket;
  cricketInput.hidden = !isCricket;

  if (isCricket) {
    leftScore.textContent = p1.points;
    rightScore.textContent = p2.points;
    renderCricketTable();
  } else {
    leftScore.textContent = p1.score;
    rightScore.textContent = p2.score;
    lastLeft.textContent = p1.lastVisit;
    lastRight.textContent = p2.lastVisit;
    statusText.textContent = state.matchOver ? statusText.textContent : "Leg on";
  }
}

gamePicker.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-game]");
  if (!button) return;
  pickGame(button.dataset.game);
});

beginButton.addEventListener("click", beginMatch);
homeButton.addEventListener("click", goHome);

dartGrid.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-value]");
  if (!button) return;
  handleDartButtonClick(Number(button.dataset.value));
});

clearDartsButton.addEventListener("click", clearCurrentDarts);
undoDartButton.addEventListener("click", undoLastEntry);
recordVisitButton.addEventListener("click", recordVisit);

multiplierButtons.forEach((button) =>
  button.addEventListener("click", () => setActiveMultiplier(Number(button.dataset.mult)))
);

cricketTable.addEventListener("click", (event) => {
  const row = event.target.closest(".cricket-row");
  if (!row) return;
  const target = Number(row.dataset.target);

  if (event.target.classList.contains("cricket-number")) {
    queueCricketHit(target, 1);
  }

  if (event.target.classList.contains("cricket-btn")) {
    const hits = Number(event.target.dataset.hits);
    queueCricketHit(target, hits);
  }
});

buildDartGrid();
setActiveMultiplier(1);
updateDartSelectionText();
updateCricketSelectionText();
~');

commit;

-- Usage:
--  sqlplus user/password@connect @oracle_seed.sql
--  -- Reconstruct files locally:
--  set pagesize 0 linesize 32767 long 1000000 longchunksize 1000000
--  spool index.html; select content from dart_app_files where filename='index.html'; spool off;
