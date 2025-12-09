const gamePicker = document.getElementById("game-picker");
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
  updateDartSelectionText();
  updateCricketSelectionText();
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
  const slots = [0, 1, 2].map((idx) => {
    const slotState = idx < count ? idx + 1 : 0;
    if (slotState === 1) return '<span class="mark-slot mark-slot--slash">/</span>';
    if (slotState === 2) return '<span class="mark-slot mark-slot--x">×</span>';
    if (slotState === 3) return '<span class="mark-slot mark-slot--closed">Ⓧ</span>';
    return '<span class="mark-slot">○</span>';
  });
  return slots.join("");
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
}

function undoLastEntry() {
  if (state.gameType === "cricket") {
    const removed = state.cricketSelections.pop();
    if (removed) {
      state.cricketDarts = Math.max(0, state.cricketDarts - removed.hits);
    }
    updateCricketSelectionText();
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
  const remaining = 3 - state.cricketDarts;
  if (remaining <= 0 || hits > remaining) return;

  state.cricketSelections.push({ target, hits });
  state.cricketDarts += hits;
  updateCricketSelectionText();
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
  const rows = targets
    .map((target) => {
      const label = target === 25 ? "B" : target;
      const p1Marks = Math.min(3, p1.marks[target]);
      const p2Marks = Math.min(3, p2.marks[target]);
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
