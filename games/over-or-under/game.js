(() => {
  const GAME_ID   = 'over-or-under';
  const LIVES_MAX = 3;
  const ROUNDS    = 10;
  const JUDGE_MS  = 5000;

  let state = {};
  let phase = 'idle'; // idle | flashing | judging | result
  let answered = false;
  let timerInterval = null;
  let judgeStart = 0;
  let flashTimeout = null;

  const livesEl       = document.getElementById('lives');
  const scoreEl       = document.getElementById('score');
  const streakEl      = document.getElementById('streak');
  const timerBar      = document.getElementById('timer-bar');
  const gameArea      = document.getElementById('game-area');
  const roundLabel    = document.getElementById('round-label');
  const targetLabel   = document.getElementById('target-label');
  const numbersDisplay = document.getElementById('numbers-display');
  const statusLabel   = document.getElementById('status-label');
  const btnOver       = document.getElementById('btn-over');
  const btnUnder      = document.getElementById('btn-under');
  const endScreen     = document.getElementById('end-screen');
  const endScore      = document.getElementById('end-score');
  const endStreak     = document.getElementById('end-streak');
  const endBest       = document.getElementById('end-best');
  const leaderboardEl = document.getElementById('leaderboard');

  function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

  function targetFor(round) {
    if (round <= 3) return 20;
    if (round <= 7) return 50;
    return 100;
  }

  function flashTimeFor(round) {
    return Math.round(1000 - 600 * (round - 1) / 9);
  }

  function splitSum(total, n) {
    let remaining = total;
    const parts = [];
    for (let i = 0; i < n - 1; i++) {
      const maxForThis = remaining - (n - 1 - i);
      const val = rand(1, Math.max(1, maxForThis));
      parts.push(val);
      remaining -= val;
    }
    parts.push(remaining);
    return shuffle(parts);
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function startGame() {
    clearInterval(timerInterval);
    clearTimeout(flashTimeout);
    PlayCounter.increment(GAME_ID);
    state = { score: 0, streak: 0, bestStreak: 0, lives: LIVES_MAX, round: 0 };
    phase = 'idle';
    endScreen.hidden  = true;
    gameArea.hidden   = false;
    gameArea.className = '';
    updateHUD();
    setTimerBar(0);
    nextRound();
  }

  function nextRound() {
    state.round++;
    answered = false;
    phase = 'flashing';
    gameArea.className = '';
    roundLabel.textContent  = 'Round ' + state.round + ' of ' + ROUNDS;
    statusLabel.textContent = 'Watch the numbers!';
    btnOver.disabled = true;
    btnUnder.disabled = true;
    btnOver.className = 'choice-btn';
    btnUnder.className = 'choice-btn';
    updateProgress();

    const target = targetFor(state.round);
    const numberCount = (state.round >= 4 && Math.random() < 0.3) ? 4 : 3;
    const isOver = Math.random() < 0.5;
    const offset = rand(1, Math.max(1, Math.floor(target * 0.15)));
    const actualSum = isOver ? target + offset : target - offset;
    const parts = splitSum(actualSum, numberCount);

    state.target = target;
    state.actualSum = actualSum;

    targetLabel.textContent = 'vs ' + target;
    numbersDisplay.className = '';
    numbersDisplay.innerHTML = parts.map(v => '<div class="num-pill">' + v + '</div>').join('');

    flashTimeout = setTimeout(() => {
      numbersDisplay.className = 'hidden-numbers';
      showChoices();
    }, flashTimeFor(state.round));
  }

  function showChoices() {
    phase = 'judging';
    statusLabel.textContent = 'Over or under ' + state.target + '?';
    btnOver.disabled = false;
    btnUnder.disabled = false;
    judgeStart = Date.now();

    timerBar.style.transition = 'none';
    timerBar.style.width = '100%';
    void timerBar.offsetWidth;
    timerBar.style.transition = 'width ' + JUDGE_MS + 'ms linear';
    timerBar.style.width = '0%';

    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      if (Date.now() - judgeStart >= JUDGE_MS) {
        clearInterval(timerInterval);
        handleChoice(null);
      }
    }, 200);
  }

  function handleChoice(choice) {
    if (answered || phase !== 'judging') return;
    answered = true;
    clearInterval(timerInterval);
    timerBar.style.transition = 'none';
    btnOver.disabled = true;
    btnUnder.disabled = true;

    const elapsed = Date.now() - judgeStart;
    const correctDir = state.actualSum > state.target ? 'over' : 'under';
    const correct = choice === correctDir;
    const btn = choice === 'over' ? btnOver : choice === 'under' ? btnUnder : null;

    if (correct) {
      const base = elapsed <= 1000 ? 20 : 10;
      const mult = state.streak >= 10 ? 2 : state.streak >= 5 ? 1.5 : 1;
      const pts  = Math.round(base * mult);
      state.score += pts;
      state.streak++;
      state.bestStreak = Math.max(state.bestStreak, state.streak);
      if (btn) btn.classList.add('correct');
      gameArea.className = 'correct';
      statusLabel.textContent = 'Correct! +' + pts + ' pts (was ' + state.actualSum + ')';
    } else {
      state.lives--;
      state.streak = 0;
      if (btn) btn.classList.add('wrong');
      (correctDir === 'over' ? btnOver : btnUnder).classList.add('correct');
      gameArea.className = 'wrong';
      statusLabel.textContent = choice === null
        ? 'Time! It was ' + state.actualSum
        : 'Wrong! It was ' + state.actualSum;
    }

    updateHUD();
    phase = 'result';

    setTimeout(() => {
      if (state.lives <= 0 || state.round >= ROUNDS) endGame();
      else nextRound();
    }, state.lives <= 0 ? 1800 : 1500);
  }

  function setTimerBar(pct) {
    timerBar.style.transition = 'none';
    timerBar.style.width = pct + '%';
  }

  function updateProgress() {
    timerBar.style.transition = 'none';
    timerBar.style.width = ((state.round / ROUNDS) * 100) + '%';
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

  btnOver.addEventListener('click', () => handleChoice('over'));
  btnUnder.addEventListener('click', () => handleChoice('under'));

  document.addEventListener('keydown', e => {
    if (!endScreen.hidden) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startGame(); }
      return;
    }
    if (e.key === 'ArrowUp')   { e.preventDefault(); handleChoice('over'); }
    if (e.key === 'ArrowDown') { e.preventDefault(); handleChoice('under'); }
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
