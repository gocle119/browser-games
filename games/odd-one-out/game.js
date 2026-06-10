(() => {
  const GAME_ID    = 'odd-one-out';
  const LIVES_MAX  = 3;
  const TIME_LIMIT = 12000;
  const PTS        = [10, 20, 30];

  let state    = {};
  let puzzles  = [];
  let phase    = 'idle'; // idle | active | result
  let answered = false;
  let timerInterval = null;
  let timerStart    = 0;

  const livesEl    = document.getElementById('lives');
  const scoreEl    = document.getElementById('score');
  const streakEl   = document.getElementById('streak');
  const timerBar   = document.getElementById('timer-bar');
  const gameArea   = document.getElementById('game-area');
  const roundLabel = document.getElementById('round-label');
  const diffBadge  = document.getElementById('diff-badge');
  const numGrid    = document.getElementById('number-grid');
  const propLabel  = document.getElementById('property-label');
  const tiles      = Array.from(document.querySelectorAll('.num-tile'));
  const endScreen  = document.getElementById('end-screen');
  const endScore   = document.getElementById('end-score');
  const endStreak  = document.getElementById('end-streak');
  const endBest    = document.getElementById('end-best');
  const leaderboardEl = document.getElementById('leaderboard');

  function startGame() {
    clearInterval(timerInterval);
    PlayCounter.increment(GAME_ID);
    puzzles = getPuzzles();
    state = { score: 0, streak: 0, bestStreak: 0, lives: LIVES_MAX, index: 0 };
    phase = 'active';
    endScreen.hidden  = true;
    gameArea.hidden   = false;
    gameArea.className = '';
    updateHUD();
    nextPuzzle();
  }

  function nextPuzzle() {
    if (state.index >= puzzles.length) { endGame(); return; }
    const p = puzzles[state.index];
    answered = false;
    phase = 'active';
    gameArea.className = '';
    numGrid.className  = '';
    propLabel.textContent = '';

    roundLabel.textContent = 'Puzzle ' + (state.index + 1);
    diffBadge.textContent  = ['Easy','Medium','Hard'][p.difficulty - 1];
    diffBadge.className    = 'badge d' + p.difficulty;

    // shuffle display order but keep mapping to original indices
    state.displayOrder = shuffle([0, 1, 2, 3]);
    state.displayOrder.forEach((origIdx, slot) => {
      tiles[slot].textContent = p.numbers[origIdx];
      tiles[slot].className   = 'num-tile';
    });

    startTimerBar();
    timerStart = Date.now();
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      if (Date.now() - timerStart >= TIME_LIMIT) {
        clearInterval(timerInterval);
        handleAnswer(-1);
      }
    }, 200);
  }

  function handleAnswer(slot) {
    if (answered || phase !== 'active') return;
    answered = true;
    clearInterval(timerInterval);
    stopTimerBar();
    numGrid.className = 'locked';

    const p = puzzles[state.index];
    const elapsed = Date.now() - timerStart;

    if (slot === -1) {
      // timeout
      state.lives--;
      state.streak = 0;
      gameArea.className = 'wrong';
      // reveal answer
      state.displayOrder.forEach((origIdx, s) => {
        if (origIdx === p.oddIndex) tiles[s].classList.add('reveal');
      });
      propLabel.textContent = 'Time! — ' + p.property;
    } else {
      const origIdx = state.displayOrder[slot];
      if (origIdx === p.oddIndex) {
        // correct
        const base     = PTS[p.difficulty - 1];
        const speedPct = elapsed / TIME_LIMIT;
        const bonus    = speedPct <= 0.4 ? Math.round(base * 0.5) : 0;
        const mult     = state.streak >= 10 ? 2 : state.streak >= 5 ? 1.5 : 1;
        const pts      = Math.round((base + bonus) * mult);
        state.score += pts;
        state.streak++;
        state.bestStreak = Math.max(state.bestStreak, state.streak);
        tiles[slot].classList.add('correct');
        gameArea.className = 'correct';
        propLabel.textContent = '+' + pts + ' pts — ' + p.property;
      } else {
        state.lives--;
        state.streak = 0;
        tiles[slot].classList.add('wrong');
        gameArea.className = 'wrong';
        // reveal correct
        state.displayOrder.forEach((oIdx, s) => {
          if (oIdx === p.oddIndex) tiles[s].classList.add('reveal');
        });
        propLabel.textContent = 'Wrong — ' + p.property;
      }
    }

    state.index++;
    updateHUD();
    phase = 'result';

    setTimeout(() => {
      if (state.lives <= 0) { endGame(); return; }
      nextPuzzle();
    }, state.lives <= 0 ? 1800 : 1600);
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function startTimerBar() {
    timerBar.style.transition = 'none';
    timerBar.style.width = '100%';
    void timerBar.offsetWidth;
    timerBar.style.transition = 'width ' + TIME_LIMIT + 'ms linear';
    timerBar.style.width = '0%';
  }

  function stopTimerBar() {
    timerBar.style.transition = 'none';
  }

  function updateHUD() {
    scoreEl.textContent  = state.score;
    streakEl.textContent = state.streak > 0 ? '🔥 ' + state.streak : '—';
    livesEl.innerHTML    = '❤️'.repeat(state.lives) + '🖤'.repeat(LIVES_MAX - state.lives);
  }

  function endGame() {
    clearInterval(timerInterval);
    gameArea.hidden  = true;
    endScreen.hidden = false;

    Scores.saveScore(GAME_ID, state.score, state.bestStreak);
    const pb    = Scores.getPersonalBest(GAME_ID);
    const board = Scores.getLeaderboard(GAME_ID, 5);

    endScore.textContent  = state.score;
    endStreak.textContent = state.bestStreak;
    endBest.textContent   = pb;

    const nameInput = document.getElementById('player-name');
    nameInput.value = localStorage.getItem('player_name') || '';
    const submitBtn = document.getElementById('btn-submit-score');
    submitBtn.disabled    = false;
    submitBtn.textContent = 'Submit';
    renderGlobalLeaderboard();

    leaderboardEl.innerHTML = board.map((e, i) =>
      '<div class="lb-row ' + (i === 0 ? 'lb-top' : '') + '">' +
        '<span class="lb-rank">' + (i===0?'🥇':i===1?'🥈':i===2?'🥉':'#'+(i+1)) + '</span>' +
        '<span class="lb-score">' + e.score + '</span>' +
        '<span class="lb-meta">streak ' + e.streak + ' · ' + e.date + '</span>' +
      '</div>'
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
        '<div class="lb-row ' + (i === 0 ? 'lb-top' : '') + '">' +
          '<span class="lb-rank">' + (i===0?'🥇':i===1?'🥈':i===2?'🥉':'#'+(i+1)) + '</span>' +
          '<span class="lb-name">' + escapeHtml(e.name) + '</span>' +
          '<span class="lb-score">' + e.score + '</span>' +
          '<span class="lb-meta">streak ' + e.streak + ' · ' + e.date + '</span>' +
        '</div>'
      ).join('');
    });
  }

  tiles.forEach((tile, slot) => tile.addEventListener('click', () => handleAnswer(slot)));

  document.addEventListener('keydown', e => {
    if (!endScreen.hidden) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startGame(); }
      return;
    }
    const map = { '1': 0, '2': 1, '3': 2, '4': 3 };
    if (map[e.key] !== undefined) handleAnswer(map[e.key]);
  });

  document.getElementById('btn-play-again').addEventListener('click', startGame);

  document.getElementById('btn-submit-score').addEventListener('click', () => {
    const nameInput = document.getElementById('player-name');
    const name = nameInput.value.trim();
    if (!name) { nameInput.focus(); return; }
    localStorage.setItem('player_name', name);
    const btn = document.getElementById('btn-submit-score');
    btn.disabled    = true;
    btn.textContent = 'Saved!';
    PlayCounter.submitScore(GAME_ID, name, state.score, state.bestStreak)
      .then(renderGlobalLeaderboard);
  });

  startGame();
})();
