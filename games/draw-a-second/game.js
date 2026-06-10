(() => {
  const GAME_ID = 'draw-a-second';
  const ROUNDS  = 10;
  const TARGET  = 1000; // ms

  let state = {};
  let phase = 'idle'; // idle | ready | timing | result

  const roundHudEl  = document.getElementById('round-hud');
  const scoreEl     = document.getElementById('score');
  const bestOffEl   = document.getElementById('best-off');
  const timerBar    = document.getElementById('timer-bar');
  const gameArea    = document.getElementById('game-area');
  const statusLabel = document.getElementById('status-label');
  const resultLabel = document.getElementById('result-label');
  const endScreen   = document.getElementById('end-screen');
  const endScore    = document.getElementById('end-score');
  const endBestOff  = document.getElementById('end-best-off');
  const endAvgOff   = document.getElementById('end-avg-off');
  const endSub      = document.getElementById('end-sub');
  const leaderboardEl = document.getElementById('leaderboard');

  function startGame() {
    PlayCounter.increment(GAME_ID);
    state = { score: 0, streak: 0, bestStreak: 0, round: 0, attempts: [], bestOff: null };
    phase = 'ready';
    endScreen.hidden  = true;
    gameArea.hidden   = false;
    gameArea.className = '';
    resultLabel.textContent = '';
    resultLabel.className   = '';
    statusLabel.textContent = 'Tap to start';
    updateHUD();
    updateProgress();
  }

  function handleTap() {
    if (phase === 'ready') {
      phase = 'timing';
      state.tapStart = Date.now();
      gameArea.className = 'timing';
      statusLabel.textContent = 'Tap to stop!';
      resultLabel.textContent = '';
      resultLabel.className   = '';
      return;
    }

    if (phase === 'timing') {
      const elapsed = Date.now() - state.tapStart;
      const off     = Math.abs(elapsed - TARGET);
      const pts     = Math.max(0, Math.round(100 - off / 10));
      state.score  += pts;
      state.attempts.push(elapsed);
      if (state.bestOff === null || off < state.bestOff) state.bestOff = off;

      phase = 'result';
      gameArea.className = '';

      const sign = elapsed > TARGET ? 'too long' : 'too short';
      resultLabel.textContent = elapsed + 'ms — ' + off + 'ms ' + sign;
      if (off < 100)       { resultLabel.className = 'good'; }
      else if (off < 300)  { resultLabel.className = 'ok'; }
      else                 { resultLabel.className = 'bad'; }

      statusLabel.textContent = '+' + pts + ' pts';
      updateHUD();

      state.round++;
      setTimeout(() => {
        if (state.round >= ROUNDS) { endGame(); return; }
        phase = 'ready';
        statusLabel.textContent = 'Tap to start';
        resultLabel.textContent = '';
        resultLabel.className   = '';
        gameArea.className      = '';
        updateProgress();
      }, 1800);
    }
  }

  function updateHUD() {
    scoreEl.textContent    = state.score;
    roundHudEl.textContent = (state.round + (phase === 'result' ? 0 : 0) + 1) + ' / ' + ROUNDS;
    bestOffEl.textContent  = state.bestOff !== null ? state.bestOff + 'ms' : '—';
  }

  function updateProgress() {
    timerBar.style.transition = 'none';
    timerBar.style.width = ((state.round / ROUNDS) * 100) + '%';
  }

  function endGame() {
    gameArea.hidden  = true;
    endScreen.hidden = false;

    Scores.saveScore(GAME_ID, state.score, 0);
    const pb    = Scores.getPersonalBest(GAME_ID);
    const board = Scores.getLeaderboard(GAME_ID, 5);

    endScore.textContent = state.score;

    if (state.attempts.length) {
      const offs   = state.attempts.map(a => Math.abs(a - TARGET));
      const best   = Math.min(...offs);
      const avgOff = Math.round(offs.reduce((a, b) => a + b, 0) / offs.length);
      endBestOff.textContent = best + 'ms';
      endAvgOff.textContent  = avgOff + 'ms';
      endSub.textContent     = 'Avg error: ' + avgOff + 'ms';
    }

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
        '<span class="lb-meta">' + e.date + '</span>' +
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
          '<span class="lb-meta">' + e.date + '</span>' +
        '</div>'
      ).join('');
    });
  }

  gameArea.addEventListener('click', () => {
    if (phase === 'result') return;
    handleTap();
  });

  document.addEventListener('keydown', e => {
    if (!endScreen.hidden) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startGame(); }
      return;
    }
    if (e.key === ' ') { e.preventDefault(); if (phase !== 'result') handleTap(); }
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
    PlayCounter.submitScore(GAME_ID, name, state.score, 0)
      .then(renderGlobalLeaderboard);
  });

  startGame();
})();
