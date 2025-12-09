const setupForm = document.getElementById("setup-form");
const gameTypeSelect = document.getElementById("game-type");
const playersInput = document.getElementById("players");
const recordButton = document.getElementById("record-throw");
const nextButton = document.getElementById("next-player");
const resetButton = document.getElementById("reset");
const currentPlayerPill = document.getElementById("current-player-pill");
const scoreboardEl = document.getElementById("scoreboard");
const turnControls = document.getElementById("turn-controls");
const visitScoreInput = document.getElementById("visit-score");
const dartGrid = document.getElementById("dart-grid");
const dartSelection = document.getElementById("dart-selection");
const clearDartsButton = document.getElementById("clear-darts");
const multiplierButtons = document.querySelectorAll(".toggle-group .toggle");
const cricketTargetSelect = document.getElementById("cricket-target");
const cricketHitsInput = document.getElementById("cricket-hits");
const feedbackEl = document.getElementById("turn-feedback");
const setupWarning = document.getElementById("setup-warning");

const targets = [20, 19, 18, 17, 16, 15, 25];
const dartNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 25];

const state = {
  gameType: "501",
  settings: {},
  players: [],
  currentPlayer: 0,
  matchOver: false,
  currentDarts: [],
  activeMultiplier: 1,
};

function setVisibility(gameType) {
  document.querySelectorAll("[data-visibility]").forEach((el) => {
    const scope = el.getAttribute("data-visibility");
    const isX01Turn = scope === "x01-turn" && gameType !== "cricket";
    const shouldShow = scope === gameType || scope === "players" || isX01Turn;
    el.style.display = shouldShow ? "flex" : "none";
  });
}

function resetMatch() {
  state.players = [];
  state.currentPlayer = 0;
  state.matchOver = false;
  state.currentDarts = [];
  recordButton.disabled = true;
  nextButton.disabled = true;
  feedbackEl.textContent = "";
  currentPlayerPill.textContent = "No match yet";
  scoreboardEl.innerHTML = "";
  turnControls.setAttribute("data-state", "idle");
  setupWarning.style.display = "block";
  updateDartSelectionText();
}

function parsePlayers(raw) {
  return raw
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
}

function createPlayer(name) {
  if (state.gameType === "cricket") {
    return {
      name,
      points: 0,
      marks: targets.reduce((acc, t) => ({ ...acc, [t]: 0 }), {}),
      status: "",
    };
  }

  return {
    name,
    startScore: state.settings.startScore,
    score: state.settings.startScore,
    isIn: !state.settings.doubleInRequired,
    status: "",
    lastVisit: null,
  };
}

function startMatch(event) {
  event.preventDefault();
  const selectedGame = gameTypeSelect.value;
  const players = parsePlayers(playersInput.value);
  if (players.length < 2) {
    feedbackEl.textContent = "Add at least two players to start a match.";
    return;
  }

  state.gameType = selectedGame;
  if (selectedGame === "cricket") {
    state.settings = {};
  } else {
    state.settings = {
      startScore: Number(selectedGame),
      doubleOutRequired: true,
      doubleInRequired: selectedGame === "301",
    };
  }

  state.players = players.map(createPlayer);
  state.currentPlayer = 0;
  state.matchOver = false;
  state.currentDarts = [];
  recordButton.disabled = false;
  nextButton.disabled = false;
  turnControls.setAttribute("data-state", "active");
  setupWarning.style.display = "none";
  feedbackEl.textContent = "Match started!";
  updateCurrentPlayerPill();
  renderScoreboard();
  setVisibility(selectedGame);
  updateDartSelectionText();
}

function advancePlayer() {
  state.currentPlayer = (state.currentPlayer + 1) % state.players.length;
  clearCurrentDarts();
  updateCurrentPlayerPill();
}

function updateCurrentPlayerPill() {
  const player = state.players[state.currentPlayer];
  currentPlayerPill.textContent = player ? `${player.name}'s visit` : "No match yet";
}

function updateDartSelectionText() {
  if (!dartSelection) return;
  if (!state.currentDarts.length) {
    dartSelection.textContent = "No darts selected";
    visitScoreInput.value = 60;
    return;
  }

  const total = state.currentDarts.reduce((sum, dart) => sum + dart.value * dart.multiplier, 0);
  const summary = state.currentDarts
    .map((dart) => `${dart.multiplier}×${dart.value === 25 ? "Bull" : dart.value}`)
    .join(" • ");
  dartSelection.textContent = `${summary} = ${total}`;
  visitScoreInput.value = total;
}

function clearCurrentDarts() {
  state.currentDarts = [];
  updateDartSelectionText();
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
      const label = value === 25 ? "Bull (25)" : value;
      return `<button type="button" class="pad-button" data-value="${value}">${label}</button>`;
    })
    .join("");
}

function handleDartButtonClick(value) {
  if (state.gameType === "cricket" || state.matchOver || !state.players.length) return;
  if (state.currentDarts.length >= 3) return;

  state.currentDarts.push({ value, multiplier: state.activeMultiplier });
  updateDartSelectionText();

  if (state.currentDarts.length === 3) {
    recordVisitFromDarts();
  }
}

function recordVisitFromDarts() {
  if (!state.currentDarts.length) return;
  const darts = [...state.currentDarts];
  const score = darts.reduce((sum, dart) => sum + dart.value * dart.multiplier, 0);
  const doubleInAchieved = darts.some((dart) => dart.multiplier === 2);
  const finalDartDouble = darts[darts.length - 1].multiplier === 2;

  handleX01Throw({ score, doubleInAchieved, finalDartDouble });
  clearCurrentDarts();
}

function bust(player, reason) {
  player.status = "Bust";
  feedbackEl.textContent = `${player.name} busts: ${reason}`;
  feedbackEl.className = "status-bust";
}

function markWin(player) {
  state.matchOver = true;
  player.status = "Winner";
  feedbackEl.textContent = `${player.name} wins the leg!`;
  feedbackEl.className = "status-win";
  recordButton.disabled = true;
  nextButton.disabled = true;
  clearCurrentDarts();
}

function handleX01Throw(visitOverride = {}) {
  if (state.matchOver) return;

  const score = visitOverride.score ?? Number(visitScoreInput.value);
  const doubleInAchieved = visitOverride.doubleInAchieved ?? false;
  const finalDartDouble = visitOverride.finalDartDouble ?? false;
  const player = state.players[state.currentPlayer];
  player.status = "";
  player.lastVisit = score;
  feedbackEl.className = "";

  if (!player.isIn && state.settings.doubleInRequired) {
    if (doubleInAchieved) {
      player.isIn = true;
    } else {
      bust(player, "double-in required");
      renderScoreboard();
      advancePlayer();
      return;
    }
  }

  const nextScore = player.score - score;

  if (nextScore < 0) {
    bust(player, "score went below zero");
  } else if (nextScore === 0) {
    if (state.settings.doubleOutRequired && !finalDartDouble) {
      bust(player, "checkout must be on a double");
    } else {
      player.score = 0;
      markWin(player);
    }
  } else {
    player.score = nextScore;
    feedbackEl.textContent = `${player.name} scored ${score}. ${nextScore} remaining.`;
    feedbackEl.className = "";
  }

  renderScoreboard();
  if (!state.matchOver) advancePlayer();
}

function allTargetsClosed(player) {
  return targets.every((t) => player.marks[t] >= 3);
}

function handleCricketThrow() {
  if (state.matchOver) return;
  const player = state.players[state.currentPlayer];
  const target = Number(cricketTargetSelect.value);
  const hits = Number(cricketHitsInput.value);
  player.status = "";
  feedbackEl.className = "";

  const previousMarks = player.marks[target];
  const projected = previousMarks + hits;
  const newMarks = Math.min(3, projected);
  const closedByOthers = state.players
    .filter((p, idx) => idx !== state.currentPlayer)
    .every((p) => p.marks[target] >= 3);

  let scoringHits = Math.max(0, projected - 3);
  if (closedByOthers) {
    scoringHits = 0;
  }

  player.marks[target] = newMarks;
  const targetValue = target === 25 ? 25 : target;
  if (player.marks[target] >= 3) {
    player.points += scoringHits * targetValue;
  }

  const closedAll = allTargetsClosed(player);
  const maxOpponentPoints = Math.max(...state.players.map((p, idx) => idx === state.currentPlayer ? player.points : p.points));

  feedbackEl.textContent = `${player.name} hits ${hits} on ${target === 25 ? "Bull" : target}.`;
  feedbackEl.className = "";

  if (closedAll && player.points >= maxOpponentPoints) {
    markWin(player);
  }

  renderScoreboard();
  if (!state.matchOver) advancePlayer();
}

function renderCricketMarks(player) {
  return `
    <div class="cricket-grid">
      ${targets
        .map((t) => {
          const marks = player.marks[t];
          const filled = "●".repeat(marks) + "○".repeat(3 - marks);
          const label = t === 25 ? "Bull" : t;
          return `<div class="target-tile"><strong>${label}</strong><span>${filled}</span></div>`;
        })
        .join("")}
    </div>
  `;
}

function renderScoreboard() {
  scoreboardEl.innerHTML = state.players
    .map((player, idx) => {
      const isTurn = idx === state.currentPlayer && !state.matchOver;
      const badge = player.status || (isTurn ? "On throw" : "Ready");
      const badgeClass = player.status === "Winner" ? "status-win" : player.status === "Bust" ? "status-bust" : "";

      if (state.gameType === "cricket") {
        return `
          <article class="player-card">
            <div class="player-card__header">
              <h3>${player.name}</h3>
              <span class="pill ${badgeClass}">${badge}</span>
            </div>
            <div class="badge-stack">
              <span class="badge">Points: ${player.points}</span>
            </div>
            ${renderCricketMarks(player)}
          </article>
        `;
      }

      return `
        <article class="player-card">
          <div class="player-card__header">
            <div>
              <h3>${player.name}</h3>
              <p class="muted small">Starting at ${player.startScore}</p>
            </div>
            <span class="pill ${badgeClass}">${badge}</span>
          </div>
          <table class="table">
            <tbody>
              <tr><th scope="row">Score</th><td><span class="score-value">${player.score}</span></td></tr>
              <tr><th scope="row">Last visit</th><td>${player.lastVisit ?? "–"}</td></tr>
              <tr><th scope="row">Double-in</th><td>${state.settings.doubleInRequired ? (player.isIn ? "✔️" : "Not in") : "Not required"}</td></tr>
              <tr><th scope="row">Double-out</th><td>${state.settings.doubleOutRequired ? "Required" : "Not required"}</td></tr>
            </tbody>
          </table>
        </article>
      `;
    })
    .join("");
}

function recordThrow() {
  if (state.gameType === "cricket") {
    handleCricketThrow();
    return;
  }

  if (state.currentDarts.length) {
    recordVisitFromDarts();
    return;
  }

  handleX01Throw();
}

function skipTurn() {
  feedbackEl.textContent = `${state.players[state.currentPlayer].name} skips the visit.`;
  feedbackEl.className = "";
  advancePlayer();
  renderScoreboard();
}

gameTypeSelect.addEventListener("change", (event) => {
  setVisibility(event.target.value);
});

setupForm.addEventListener("submit", startMatch);
recordButton.addEventListener("click", recordThrow);
nextButton.addEventListener("click", skipTurn);
resetButton.addEventListener("click", resetMatch);
dartGrid.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-value]");
  if (!button) return;
  handleDartButtonClick(Number(button.dataset.value));
});

multiplierButtons.forEach((button) =>
  button.addEventListener("click", () => setActiveMultiplier(Number(button.dataset.mult)))
);

clearDartsButton.addEventListener("click", clearCurrentDarts);

buildDartGrid();
setActiveMultiplier(1);
setVisibility("501");
resetMatch();
