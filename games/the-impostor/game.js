(() => {
  const GAME_ID   = 'the-impostor';
  const LIVES_MAX = 3;
  const TIME_BY_DIFF = { 1: 12000, 2: 9000, 3: 7000 };
  const PTS_BY_DIFF  = { 1: 10,    2: 20,   3: 30   };
  const DIFF_LABEL   = { 1: 'Easy', 2: 'Medium', 3: 'Hard' };
  const DIFF_COLOR   = { 1: '#22c55e', 2: '#f59e0b', 3: '#ef4444' };

  let state = {};
  let timerInterval = null;
  let timerStart    = null;
  let answered      = false;
  let feedbackTimeout = null;

  // DOM refs
  const livesEl      = document.getElementById('lives');
  const scoreEl      = document.getElementById('score');
  const streakEl     = document.getElementById('streak');
  const timerBar     = document.getElementById('timer-bar');
  const diffBadge    = document.getElementById('diff-badge');
  const tiles        = [0, 1, 2, 3].map(i => document.getElementById(`tile-${i}`));
  const tileWords    = [0, 1, 2, 3].map(i => document.getElementById(`word-${i}`));
  const feedbackEl   = document.getElementById('feedback');
  const feedbackIcon = document.getElementById('feedback-icon');
  const feedbackText = document.getElementById('feedback-text');
  const feedbackConn = document.getElementById('feedback-conn');
  const gameArea     = document.getElementById('game-area');
  const endScreen    = document.getElementById('end-screen');
  const endScore     = document.getElementById('end-score');
  const endStreak    = document.getElementById('end-streak');
  const endBest      = document.getElementById('end-best');
  const leaderboardEl = document.getElementById('leaderboard');

  function startGame() {
    clearTimeout(feedbackTimeout);
    feedbackTimeout = null;
    PlayCounter.increment(GAME_ID);
    state = {
      puzzles:    getPuzzles(),
      index:      0,
      score:      0,
      streak:     0,
      bestStreak: 0,
      lives:      LIVES_MAX,
      displayOrder: [],
    };
    endScreen.hidden = true;
    gameArea.hidden  = false;
    feedbackEl.hidden = true;
    updateHUD();
    nextPuzzle();
  }

  function currentPuzzle() {
    return state.puzzles[state.index];
  }

  function nextPuzzle() {
    if (state.index >= state.puzzles.length) { endGame(); return; }
    answered = false;

    const p = currentPuzzle();
    const timeLimit = TIME_BY_DIFF[p.difficulty];

    // Shuffle display order so impostor isn't always in the same slot
    const order = shuffleOrder([0, 1, 2, 3]);
    state.displayOrder = order;

    // Render tiles
    tiles.forEach((tile, slot) => {
      const srcIdx = order[slot];
      tileWords[slot].textContent = p.words[srcIdx];
      tile.className = 'tile';
      tile.disabled  = false;
    });

    // Difficulty badge
    diffBadge.textContent = DIFF_LABEL[p.difficulty];
    diffBadge.style.background = DIFF_COLOR[p.difficulty];

    // Feedback hidden
    feedbackEl.hidden = true;

    startTimer(timeLimit);
  }

  function shuffleOrder(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function startTimer(timeLimit) {
    clearInterval(timerInterval);
    timerStart = Date.now();
    timerBar.style.transition = 'none';
    timerBar.style.width = '100%';
    void timerBar.offsetWidth;
    timerBar.style.transition = `width ${timeLimit}ms linear`;
    timerBar.style.width = '0%';

    timerInterval = setInterval(() => {
      if (!answered && Date.now() - timerStart >= timeLimit) {
        clearInterval(timerInterval);
        handleAnswer(-1); // timeout
      }
    }, 200);
  }

  function handleAnswer(tappedSlot) {
    if (answered) return;
    answered = true;
    clearInterval(timerInterval);
    tiles.forEach(t => { t.disabled = true; });

    const p = currentPuzzle();
    const elapsed = Date.now() - timerStart;
    const timeLimit = TIME_BY_DIFF[p.difficulty];

    // Which source index did the player tap?
    const tappedSrcIdx = tappedSlot >= 0 ? state.displayOrder[tappedSlot] : -1;
    const correct = tappedSrcIdx === p.impostor;

    // Find which slot holds the real impostor (for highlighting)
    const impostorSlot = state.displayOrder.indexOf(p.impostor);

    if (correct) {
      const speedBonus = elapsed < timeLimit * 0.4;
      const base = PTS_BY_DIFF[p.difficulty];
      const bonus = speedBonus ? Math.round(base * 0.5) : 0;
      const multiplier = state.streak >= 10 ? 2 : state.streak >= 5 ? 1.5 : 1;
      const pts = Math.round((base + bonus) * multiplier);
      state.score += pts;
      state.streak++;
      state.bestStreak = Math.max(state.bestStreak, state.streak);
      tiles[tappedSlot].classList.add('correct');
      showFeedback(true, p, pts, speedBonus);
    } else {
      state.lives--;
      state.streak = 0;
      if (tappedSlot >= 0) tiles[tappedSlot].classList.add('wrong');
      tiles[impostorSlot].classList.add('correct');
      showFeedback(false, p, 0, false, tappedSlot < 0);
    }

    updateHUD();
    state.index++;
  }

  function showFeedback(correct, puzzle, pts, speedBonus, timedOut = false) {
    feedbackEl.hidden = false;
    feedbackEl.className = 'feedback-bar ' + (correct ? 'correct' : 'wrong');

    if (correct) {
      feedbackIcon.textContent = '✓';
      let msg = `+${pts} pts`;
      if (speedBonus) msg += ' ⚡ Speed!';
      if (state.streak > 1) msg += ` 🔥 ${state.streak} streak`;
      feedbackText.textContent = msg;
    } else {
      feedbackIcon.textContent = timedOut ? '⏱' : '✗';
      feedbackText.textContent = timedOut ? "Time's up!" : 'Wrong!';
    }

    feedbackConn.textContent = puzzle.connection;

    const delay = state.lives <= 0 ? 2000 : 1600;
    if (state.lives <= 0) {
      feedbackTimeout = setTimeout(endGame, delay);
    } else {
      feedbackTimeout = setTimeout(() => {
        feedbackEl.hidden = true;
        nextPuzzle();
      }, delay);
    }
  }

  function updateHUD() {
    scoreEl.textContent  = state.score;
    streakEl.textContent = state.streak > 0 ? `🔥 ${state.streak}` : '—';
    livesEl.innerHTML    = '❤️'.repeat(state.lives) + '🖤'.repeat(LIVES_MAX - state.lives);
  }

  function endGame() {
    feedbackEl.hidden = true;
    gameArea.hidden   = true;
    endScreen.hidden  = false;
    clearInterval(timerInterval);

    Scores.saveScore(GAME_ID, state.score, state.bestStreak);
    const pb    = Scores.getPersonalBest(GAME_ID);
    const board = Scores.getLeaderboard(GAME_ID, 5);

    endScore.textContent  = state.score;
    endStreak.textContent = state.bestStreak;
    endBest.textContent   = pb;

    const nameInput = document.getElementById('player-name');
    nameInput.value = localStorage.getItem('player_name') || '';
    const submitBtn = document.getElementById('btn-submit-score');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit';
    renderGlobalLeaderboard();

    leaderboardEl.innerHTML = board.map((entry, i) =>
      `<div class="lb-row ${i === 0 ? 'lb-top' : ''}">
        <span class="lb-rank">${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}</span>
        <span class="lb-score">${entry.score}</span>
        <span class="lb-meta">streak ${entry.streak} · ${entry.date}</span>
      </div>`
    ).join('');
  }

  function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function renderGlobalLeaderboard() {
    const el = document.getElementById('global-leaderboard');
    el.innerHTML = '<div class="lb-loading">Loading…</div>';
    PlayCounter.getTopScores(GAME_ID).then(entries => {
      if (!entries.length) { el.innerHTML = '<div class="lb-loading">No scores yet — be first!</div>'; return; }
      el.innerHTML = entries.map((e, i) =>
        `<div class="lb-row ${i === 0 ? 'lb-top' : ''}">
          <span class="lb-rank">${i===0?'🥇':i===1?'🥈':i===2?'🥉':'#'+(i+1)}</span>
          <span class="lb-name">${escapeHtml(e.name)}</span>
          <span class="lb-score">${e.score}</span>
          <span class="lb-meta">streak ${e.streak} · ${e.date}</span>
        </div>`
      ).join('');
    });
  }

  // Tap feedback bar to advance immediately
  feedbackEl.addEventListener('click', () => {
    if (feedbackEl.hidden) return;
    clearTimeout(feedbackTimeout);
    feedbackTimeout = null;
    feedbackEl.hidden = true;
    if (state.lives <= 0) endGame();
    else nextPuzzle();
  });

  // Tile click listeners
  tiles.forEach((tile, slot) => {
    tile.addEventListener('click', () => handleAnswer(slot));
  });

  document.getElementById('btn-play-again').addEventListener('click', startGame);

  document.getElementById('btn-submit-score').addEventListener('click', () => {
    const nameInput = document.getElementById('player-name');
    const name = nameInput.value.trim();
    if (!name) { nameInput.focus(); return; }
    localStorage.setItem('player_name', name);
    const btn = document.getElementById('btn-submit-score');
    btn.disabled = true;
    btn.textContent = 'Saved!';
    PlayCounter.submitScore(GAME_ID, name, state.score, state.bestStreak)
      .then(renderGlobalLeaderboard);
  });

  // Keyboard: 1-4 keys for tiles (desktop)
  document.addEventListener('keydown', e => {
    if (!endScreen.hidden) {
      if (e.key === 'Enter' || e.key === ' ') startGame();
      return;
    }
    const map = { '1': 0, '2': 1, '3': 2, '4': 3 };
    if (map[e.key] !== undefined) handleAnswer(map[e.key]);
  });

  startGame();
})();
