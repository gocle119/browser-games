(() => {
  const GAME_ID    = 'simon-says-tap';
  const LIVES_MAX  = 3;
  const FLASH_ON   = 600;  // ms each button stays lit during show
  const FLASH_GAP  = 200;  // ms gap between flashes
  const TAP_LIMIT  = 3000; // ms per tap during input phase

  let state = {};
  let phase = 'idle'; // idle | showing | input | result
  let tapTimer = null;

  const livesEl     = document.getElementById('lives');
  const scoreEl     = document.getElementById('score');
  const streakEl    = document.getElementById('streak');
  const timerBar    = document.getElementById('timer-bar');
  const gameArea    = document.getElementById('game-area');
  const seqLabel    = document.getElementById('seq-label');
  const simonGrid   = document.getElementById('simon-grid');
  const statusLabel = document.getElementById('status-label');
  const buttons     = Array.from(document.querySelectorAll('.simon-btn'));
  const endScreen   = document.getElementById('end-screen');
  const endScore    = document.getElementById('end-score');
  const endStreak   = document.getElementById('end-streak');
  const endBest     = document.getElementById('end-best');
  const leaderboardEl = document.getElementById('leaderboard');

  function startGame() {
    clearTimeout(tapTimer);
    PlayCounter.increment(GAME_ID);
    state = { score: 0, streak: 0, bestStreak: 0, lives: LIVES_MAX,
              sequence: [], inputIndex: 0, maxLength: 0 };
    phase = 'idle';
    endScreen.hidden  = true;
    gameArea.hidden   = false;
    gameArea.className = '';
    simonGrid.className = 'locked';
    seqLabel.textContent  = 'Simon Says Tap';
    statusLabel.textContent = 'Tap to begin';
    updateHUD();
    resetTimerBar();
  }

  function nextRound() {
    // add one more color to sequence
    state.sequence.push(Math.floor(Math.random() * 4));
    state.inputIndex = 0;
    phase = 'showing';
    simonGrid.className = 'locked';
    seqLabel.textContent = 'Watch…';
    statusLabel.textContent = '';
    resetTimerBar();
    showSequence(0);
  }

  function showSequence(i) {
    if (i >= state.sequence.length) {
      // sequence done, start input
      setTimeout(startInput, FLASH_GAP);
      return;
    }
    const btn = buttons[state.sequence[i]];
    btn.classList.add('lit');
    setTimeout(() => {
      btn.classList.remove('lit');
      setTimeout(() => showSequence(i + 1), FLASH_GAP);
    }, FLASH_ON);
  }

  function startInput() {
    phase = 'input';
    simonGrid.className = '';
    seqLabel.textContent  = 'Your turn! (' + state.sequence.length + ' taps)';
    statusLabel.textContent = '';
    startTapTimer();
  }

  function startTapTimer() {
    clearTimeout(tapTimer);
    timerBar.style.transition = 'none';
    timerBar.style.width = '100%';
    void timerBar.offsetWidth;
    timerBar.style.transition = 'width ' + TAP_LIMIT + 'ms linear';
    timerBar.style.width = '0%';
    tapTimer = setTimeout(() => handleWrong('Time\'s up!'), TAP_LIMIT);
  }

  function handleButtonTap(idx) {
    if (phase !== 'input') return;
    clearTimeout(tapTimer);

    const btn = buttons[idx];
    btn.classList.add('lit-input');
    setTimeout(() => btn.classList.remove('lit-input'), 200);

    if (idx === state.sequence[state.inputIndex]) {
      state.inputIndex++;
      if (state.inputIndex >= state.sequence.length) {
        // completed sequence
        const len  = state.sequence.length;
        const mult = state.streak >= 10 ? 2 : state.streak >= 5 ? 1.5 : 1;
        const pts  = Math.round(len * 20 * mult);
        state.score += pts;
        state.streak++;
        state.bestStreak  = Math.max(state.bestStreak, state.streak);
        state.maxLength   = Math.max(state.maxLength, len);
        phase = 'result';
        simonGrid.className = 'locked';
        gameArea.className  = 'correct';
        seqLabel.textContent  = '+' + pts + ' pts' + (state.streak > 1 ? ' 🔥 ' + state.streak : '');
        statusLabel.textContent = 'Length ' + len + ' ✓';
        updateHUD();
        resetTimerBar();
        setTimeout(() => { gameArea.className = ''; nextRound(); }, 1000);
      } else {
        // more taps needed
        startTapTimer();
      }
    } else {
      handleWrong('Wrong tap!');
    }
  }

  function handleWrong(msg) {
    if (phase !== 'input') return;
    clearTimeout(tapTimer);
    phase = 'result';
    simonGrid.className = 'locked';
    state.lives--;
    state.streak = 0;
    gameArea.className = 'wrong';
    seqLabel.textContent    = msg;
    statusLabel.textContent = '−1 life';
    updateHUD();
    resetTimerBar();

    setTimeout(() => {
      if (state.lives <= 0) { endGame(); return; }
      // reset sequence on wrong tap
      state.sequence = [];
      gameArea.className = '';
      nextRound();
    }, 1500);
  }

  function updateHUD() {
    scoreEl.textContent  = state.score;
    streakEl.textContent = state.streak > 0 ? '🔥 ' + state.streak : '—';
    livesEl.innerHTML    = '❤️'.repeat(state.lives) + '🖤'.repeat(LIVES_MAX - state.lives);
  }

  function resetTimerBar() {
    timerBar.style.transition = 'none';
    timerBar.style.width = '0%';
  }

  function endGame() {
    clearTimeout(tapTimer);
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

  buttons.forEach(btn => {
    btn.addEventListener('click', () => handleButtonTap(+btn.dataset.idx));
  });

  gameArea.addEventListener('click', e => {
    if (e.target === gameArea || e.target === seqLabel || e.target === statusLabel) {
      if (phase === 'idle') nextRound();
    }
  });

  document.addEventListener('keydown', e => {
    if (!endScreen.hidden) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startGame(); }
      return;
    }
    if (phase === 'idle' && e.key === ' ') { e.preventDefault(); nextRound(); }
    const map = { '1': 0, '2': 1, '3': 2, '4': 3 };
    if (map[e.key] !== undefined) handleButtonTap(map[e.key]);
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
