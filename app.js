const setupForm = document.getElementById("setup-form");
const gameTypeSelect = document.getElementById("game-type");
const startScoreSelect = document.getElementById("start-score");
const doubleOutCheckbox = document.getElementById("double-out");
const playersInput = document.getElementById("players");
const recordButton = document.getElementById("record-throw");
const nextButton = document.getElementById("next-player");
const resetButton = document.getElementById("reset");
const currentPlayerPill = document.getElementById("current-player-pill");
const scoreboardEl = document.getElementById("scoreboard");
const turnControls = document.getElementById("turn-controls");
const visitScoreInput = document.getElementById("visit-score");
const doubleInToggle = document.getElementById("double-in-toggle");
const doubleInHit = document.getElementById("double-in-hit");
const doubleOutHit = document.getElementById("double-out-hit");
const cricketTargetSelect = document.getElementById("cricket-target");
const cricketHitsInput = document.getElementById("cricket-hits");
const feedbackEl = document.getElementById("turn-feedback");
const setupWarning = document.getElementById("setup-warning");

const targets = [20, 19, 18, 17, 16, 15, 25];

const state = {
  gameType: "x01",
  settings: {},
  players: [],
  currentPlayer: 0,
  matchOver: false,
};

function setVisibility(gameType) {
  document.querySelectorAll("[data-visibility]").forEach((el) => {
    const scope = el.getAttribute("data-visibility");
    const isX01Turn = scope === "x01-turn" && (gameType === "x01" || gameType === "minnesota");
    const isX01Setup = scope === "x01-setup" && gameType === "x01";
    const shouldShow =
      scope === gameType ||
      scope === "players" ||
      isX01Turn ||
      isX01Setup;
    el.style.display = shouldShow ? "flex" : "none";
  });

  doubleInToggle.style.display = state.settings.doubleInRequired ? "flex" : "none";
}

function resetMatch() {
  state.players = [];
  state.currentPlayer = 0;
  state.matchOver = false;
  recordButton.disabled = true;
  nextButton.disabled = true;
  feedbackEl.textContent = "";
  currentPlayerPill.textContent = "No match yet";
  scoreboardEl.innerHTML = "";
  turnControls.setAttribute("data-state", "idle");
  setupWarning.style.display = "block";
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
  if (selectedGame === "x01") {
    state.settings = {
      startScore: Number(startScoreSelect.value),
      doubleOutRequired: doubleOutCheckbox.checked,
      doubleInRequired: false,
    };
  } else if (selectedGame === "minnesota") {
    state.settings = {
      startScore: 301,
      doubleOutRequired: true,
      doubleInRequired: true,
    };
  } else {
    state.settings = {};
  }

  state.players = players.map(createPlayer);
  state.currentPlayer = 0;
  state.matchOver = false;
  recordButton.disabled = false;
  nextButton.disabled = false;
  turnControls.setAttribute("data-state", "active");
  setupWarning.style.display = "none";
  feedbackEl.textContent = "Match started!";
  updateCurrentPlayerPill();
  renderScoreboard();
  setVisibility(selectedGame);
  doubleInHit.checked = false;
  doubleOutHit.checked = false;
}

function advancePlayer() {
  state.currentPlayer = (state.currentPlayer + 1) % state.players.length;
  doubleInHit.checked = false;
  doubleOutHit.checked = false;
  updateCurrentPlayerPill();
}

function updateCurrentPlayerPill() {
  const player = state.players[state.currentPlayer];
  currentPlayerPill.textContent = player ? `${player.name}'s visit` : "No match yet";
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
}

function handleX01Throw() {
  if (state.matchOver) return;

  const score = Number(visitScoreInput.value);
  const player = state.players[state.currentPlayer];
  player.status = "";
  player.lastVisit = score;

  if (!player.isIn && state.settings.doubleInRequired) {
    if (doubleInHit.checked) {
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
    if (state.settings.doubleOutRequired && !doubleOutHit.checked) {
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
            <h3>${player.name}</h3>
            <span class="pill ${badgeClass}">${badge}</span>
          </div>
          <table class="table">
            <tbody>
              <tr><th scope="row">Score</th><td><span class="score-value">${player.score}</span></td></tr>
              <tr><th scope="row">Last visit</th><td>${player.lastVisit ?? "–"}</td></tr>
              <tr><th scope="row">Double-in</th><td>${state.settings.doubleInRequired ? (player.isIn ? "✔️" : "Not in") : "Not required"}</td></tr>
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
  } else {
    handleX01Throw();
  }
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

setVisibility("x01");
resetMatch();
