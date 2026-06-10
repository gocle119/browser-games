(() => {
  const GAME_ID   = 'higher-or-lower';
  const LIVES_MAX = 3;
  const ROUNDS    = 10;

  let state = {};
  let phase = 'idle'; // idle | guessing | revealing

  const livesEl    = document.getElementById('lives');
  const scoreEl    = document.getElementById('score');
  const streakEl   = document.getElementById('streak');
  const timerBar   = document.getElementById('timer-bar');
  const gameArea   = document.getElementById('game-area');
  const roundLabel = document.getElementById('round-label');
  const prevNumEl  = document.getElementById('prev-num');
  const currNumEl  = document.getElementById('curr-num');
  const arrowLabel = document.getElementById('arrow-label');
  const feedbackEl = document.getElementById('feedback-label');
  const btnHigher  = document.getElementById('btn-higher');
  const btnLower   = document.getElementById('btn-lower');
  const endScreen  = document.getElementById('end-screen');
  const endScore   = document.getElementById('end-score');
  const endStreak  = document.getElementById('end-streak');
  const endBest    = document.getElementById('end-best');
  const leaderboardEl = document.getElementById('leaderboard');

  function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

  function startGame() {
    PlayCounter.increment(GAME_ID);
    state = { score: 0, streak: 0, bestStreak: 0, lives: LIVES_MAX, round: 0,
              current: rand(1, 100), next: null };
    phase = 'guessing';
    endScreen.hidden  = true;
    gameArea.hidden   = false;
    gameArea.className = '';
    arrowLabel.textContent = '';
    arrowLabel.className   = '';
    feedbackEl.textContent = '';
    feedbackEl.className   = '';
    prevNumEl.textContent  = state.current;
    currNumEl.textContent  = '?';
    btnHigher.disabled = false;
    btnLower.disabled  = false;
    updateHUD();
    updateProgress();
  }

  function guess(direction) {
    if (phase !== 'guessing') return;
    phase = 'revealing';
    btnHigher.disabled = true;
    btnLower.disabled  = true;

    state.next = rand(1, 100);
    currNumEl.textContent = state.next;

    const actualDir = state.next > state.current ? 'higher'
                    : state.next < state.current ? 'lower'
                    : 'equal';
    const correct = actualDir === direction || actualDir === 'equal';

    if (correct) {
      const mult = state.streak >= 10 ? 2 : state.streak >= 5 ? 1.5 : 1;
      const pts  = Math.round(20 * mult);
      state.score  += pts;
      state.streak++;
      state.bestStreak = Math.max(state.bestStreak, state.streak);
      gameArea.className     = 'correct';
      arrowLabel.textContent = direction === 'higher' ? '▲' : '▼';
      arrowLabel.className   = 'correct';
      feedbackEl.textContent = '+' + pts + ' pts' + (state.streak > 1 ? ' 🔥 ' + state.streak : '');
      feedbackEl.className   = 'correct';
    } else {
      state.lives--;
      state.streak = 0;
      gameArea.className     = 'wrong';
      arrowLabel.textContent = actualDir === 'higher' ? '▲' : '▼';
      arrowLabel.className   = 'wrong';
      feedbackEl.textContent = 'Wrong! It went ' + actualDir + '.';
      feedbackEl.className   = 'wrong';
    }

    updateHUD();
    state.round++;

    setTimeout(() => {
      if (state.lives <= 0 || state.round >= ROUNDS) { endGame(); return; }
      state.current = state.next;
      prevNumEl.textContent  = state.current;
      currNumEl.textContent  = '?';
      arrowLabel.textContent = '';
      arrowLabel.className   = '';
      feedbackEl.textContent = '';
      feedbackEl.className   = '';
      gameArea.className     = '';
      btnHigher.disabled     = false;
      btnLower.disabled      = false;
      phase = 'guessing';
      updateProgress();
    }, 1500);
  }

  function updateHUD() {
    scoreEl.textContent  = state.score;
    streakEl.textContent = state.streak > 0 ? '🔥 ' + state.streak : '—';
    livesEl.innerHTML    = '❤️'.repeat(state.lives) + '🖤'.repeat(LIVES_MAX - state.lives);
    roundLabel.textContent = 'Round ' + Math.min(state.round + 1, ROUNDS) + ' of ' + ROUNDS;
  }

  function updateProgress() {
    timerBar.style.transition = 'none';
    timerBar.style.width = ((state.round / ROUNDS) * 100) + '%';
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

  btnHigher.addEventListener('click', () => guess('higher'));
  btnLower.addEventListener('click',  () => guess('lower'));

  document.addEventListener('keydown', e => {
    if (!endScreen.hidden) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startGame(); }
      return;
    }
    if (e.key === 'ArrowUp'   || e.key === 'h') guess('higher');
    if (e.key === 'ArrowDown' || e.key === 'l') guess('lower');
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
