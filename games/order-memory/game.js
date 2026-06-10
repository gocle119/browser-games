(() => {
  const GAME_ID   = 'order-memory';
  const LIVES_MAX = 3;
  const ICONS     = ['🔥', '💧', '⚡', '🌿'];
  const FLASH_ON  = 600;
  const FLASH_GAP = 200;

  let state = {};
  let phase = 'idle'; // idle | showing | input | result

  const livesEl     = document.getElementById('lives');
  const scoreEl     = document.getElementById('score');
  const streakEl    = document.getElementById('streak');
  const timerBar    = document.getElementById('timer-bar');
  const gameArea    = document.getElementById('game-area');
  const seqDisplay  = document.getElementById('seq-display');
  const statusLabel = document.getElementById('status-label');
  const iconGrid    = document.getElementById('icon-grid');
  const buttons     = Array.from(document.querySelectorAll('.icon-btn'));
  const endScreen   = document.getElementById('end-screen');
  const endScore    = document.getElementById('end-score');
  const endStreak   = document.getElementById('end-streak');
  const endBest     = document.getElementById('end-best');
  const leaderboardEl = document.getElementById('leaderboard');

  function startGame() {
    PlayCounter.increment(GAME_ID);
    state = { score: 0, streak: 0, bestStreak: 0, lives: LIVES_MAX,
              sequence: [], inputIndex: 0 };
    // start with sequence length 2
    state.sequence = [Math.floor(Math.random() * 4), Math.floor(Math.random() * 4)];
    phase = 'idle';
    endScreen.hidden  = true;
    gameArea.hidden   = false;
    gameArea.className = '';
    iconGrid.className = 'locked';
    statusLabel.textContent = 'Tap to begin';
    renderSeqDots(state.sequence, -1);
    updateHUD();
    setTimerBar(0);
  }

  function nextRound() {
    state.inputIndex = 0;
    phase = 'showing';
    iconGrid.className = 'locked';
    statusLabel.textContent = 'Watch the order…';
    gameArea.className = '';
    renderSeqDots(state.sequence, -1);
    const total = state.sequence.length;
    const totalTime = total * (FLASH_ON + FLASH_GAP);
    setTimerBar(100);
    void timerBar.offsetWidth;
    timerBar.style.transition = 'width ' + totalTime + 'ms linear';
    timerBar.style.width = '0%';
    showSequence(0);
  }

  function showSequence(i) {
    if (i >= state.sequence.length) {
      setTimeout(startInput, FLASH_GAP);
      return;
    }
    const idx = state.sequence[i];
    renderSeqDots(state.sequence, i);
    buttons[idx].classList.add('lit');
    setTimeout(() => {
      buttons[idx].classList.remove('lit');
      renderSeqDots(state.sequence, -1);
      setTimeout(() => showSequence(i + 1), FLASH_GAP);
    }, FLASH_ON);
  }

  function startInput() {
    phase = 'input';
    iconGrid.className = '';
    statusLabel.textContent = 'Repeat the order! (' + state.sequence.length + ')';
    setTimerBar(0);
    renderSeqDots(state.sequence, -1);
  }

  function handleTap(idx) {
    if (phase !== 'input') return;
    const btn = buttons[idx];
    btn.classList.add('lit');
    setTimeout(() => btn.classList.remove('lit'), 200);

    if (idx === state.sequence[state.inputIndex]) {
      renderSeqDots(state.sequence, state.inputIndex);
      state.inputIndex++;
      if (state.inputIndex >= state.sequence.length) {
        // success!
        const len  = state.sequence.length;
        const mult = state.streak >= 10 ? 2 : state.streak >= 5 ? 1.5 : 1;
        const pts  = Math.round(len * 20 * mult);
        state.score += pts;
        state.streak++;
        state.bestStreak = Math.max(state.bestStreak, state.streak);
        phase = 'result';
        iconGrid.className = 'locked';
        gameArea.className = 'correct';
        statusLabel.textContent = '+' + pts + ' pts ✓ Length ' + len;
        updateHUD();
        setTimeout(() => {
          gameArea.className = '';
          state.sequence.push(Math.floor(Math.random() * 4));
          nextRound();
        }, 1000);
      }
    } else {
      // wrong
      phase = 'result';
      iconGrid.className = 'locked';
      state.lives--;
      state.streak = 0;
      gameArea.className = 'wrong';
      statusLabel.textContent = 'Wrong order! −1 life';
      updateHUD();
      setTimeout(() => {
        if (state.lives <= 0) { endGame(); return; }
        // reset to length 2 on mistake
        state.sequence = [Math.floor(Math.random() * 4), Math.floor(Math.random() * 4)];
        gameArea.className = '';
        nextRound();
      }, 1500);
    }
  }

  function renderSeqDots(seq, activeIdx) {
    seqDisplay.innerHTML = seq.map((idx, i) =>
      '<div class="seq-dot' + (i === activeIdx ? ' active' : '') + '">' +
        (i <= activeIdx || activeIdx === -1 + seq.length ? ICONS[idx] : '·') +
      '</div>'
    ).join('');
  }

  function setTimerBar(pct) {
    timerBar.style.transition = 'none';
    timerBar.style.width = pct + '%';
  }

  function updateHUD() {
    scoreEl.textContent  = state.score;
    streakEl.textContent = state.streak > 0 ? '🔥 ' + state.streak : '—';
    livesEl.innerHTML    = '❤️'.repeat(state.lives) + '🖤'.repeat(LIVES_MAX - state.lives);
  }

  function endGame() {
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

  buttons.forEach(btn => btn.addEventListener('click', () => handleTap(+btn.dataset.idx)));

  gameArea.addEventListener('click', e => {
    if (phase === 'idle' && (e.target === gameArea || e.target === statusLabel || e.target === seqDisplay)) {
      nextRound();
    }
  });

  document.addEventListener('keydown', e => {
    if (!endScreen.hidden) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startGame(); }
      return;
    }
    if (phase === 'idle' && e.key === ' ') { e.preventDefault(); nextRound(); }
    const map = { '1': 0, '2': 1, '3': 2, '4': 3 };
    if (map[e.key] !== undefined) handleTap(map[e.key]);
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
