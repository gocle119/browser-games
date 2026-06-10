(() => {
  const GAME_ID    = 'count-the-dots';
  const LIVES_MAX  = 3;
  const ROUNDS     = 10;
  const FLASH_MS   = 500;
  const SELECT_MS  = 8000;
  const DOT_MIN    = 5;
  const DOT_MAX    = 25;
  const DOT_SIZE   = 12;

  let state    = {};
  let phase    = 'idle'; // idle | flashing | choosing | result
  let answered = false;
  let timerInterval = null;
  let timerStart    = 0;

  const livesEl    = document.getElementById('lives');
  const scoreEl    = document.getElementById('score');
  const streakEl   = document.getElementById('streak');
  const timerBar   = document.getElementById('timer-bar');
  const gameArea   = document.getElementById('game-area');
  const roundLabel = document.getElementById('round-label');
  const dotArea    = document.getElementById('dot-area');
  const statusLabel = document.getElementById('status-label');
  const choiceGrid = document.getElementById('choice-grid');
  const endScreen  = document.getElementById('end-screen');
  const endScore   = document.getElementById('end-score');
  const endStreak  = document.getElementById('end-streak');
  const endBest    = document.getElementById('end-best');
  const leaderboardEl = document.getElementById('leaderboard');

  function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

  function startGame() {
    clearInterval(timerInterval);
    PlayCounter.increment(GAME_ID);
    state = { score: 0, streak: 0, bestStreak: 0, lives: LIVES_MAX, round: 0, dotCount: 0 };
    phase = 'idle';
    endScreen.hidden  = true;
    gameArea.hidden   = false;
    gameArea.className = '';
    choiceGrid.innerHTML = '';
    dotArea.innerHTML    = '';
    dotArea.className    = '';
    statusLabel.textContent = 'Tap to begin';
    updateHUD();
    setTimerBar(0);
    nextRound();
  }

  function nextRound() {
    state.round++;
    state.dotCount = rand(DOT_MIN, DOT_MAX);
    answered = false;
    phase = 'flashing';
    gameArea.className     = '';
    choiceGrid.innerHTML   = '';
    statusLabel.textContent = 'Count fast!';
    roundLabel.textContent  = 'Round ' + state.round + ' of ' + ROUNDS;
    updateProgress();
    placeDots(state.dotCount);
    dotArea.className = '';

    // hide after FLASH_MS
    setTimeout(() => {
      dotArea.className = 'hidden-dots';
      showChoices();
    }, FLASH_MS);
  }

  function placeDots(n) {
    dotArea.innerHTML = '';
    const w = dotArea.clientWidth  || 280;
    const h = dotArea.clientHeight || 200;
    const used = [];
    for (let i = 0; i < n; i++) {
      let x, y, tries = 0;
      do {
        x = rand(DOT_SIZE, w - DOT_SIZE * 2);
        y = rand(DOT_SIZE, h - DOT_SIZE * 2);
        tries++;
      } while (tries < 30 && used.some(p => Math.abs(p.x - x) < DOT_SIZE * 1.5 && Math.abs(p.y - y) < DOT_SIZE * 1.5));
      used.push({ x, y });
      const el = document.createElement('div');
      el.className = 'dot';
      el.style.width  = DOT_SIZE + 'px';
      el.style.height = DOT_SIZE + 'px';
      el.style.left   = x + 'px';
      el.style.top    = y + 'px';
      dotArea.appendChild(el);
    }
  }

  function showChoices() {
    phase = 'choosing';
    statusLabel.textContent = 'How many dots?';
    const count = state.dotCount;

    // build 4 choices: exact + 3 distractors
    const others = new Set();
    others.add(count);
    while (others.size < 4) {
      const off = rand(1, 5) * (Math.random() < 0.5 ? 1 : -1);
      const c   = count + off;
      if (c >= 1 && c <= 35) others.add(c);
    }
    state.choices = shuffle(Array.from(others));

    choiceGrid.innerHTML = '';
    state.choices.forEach((val, i) => {
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.textContent = val;
      btn.addEventListener('click', () => handleChoice(i, val));
      choiceGrid.appendChild(btn);
    });

    timerStart = Date.now();
    timerBar.style.transition = 'none';
    timerBar.style.width = '100%';
    void timerBar.offsetWidth;
    timerBar.style.transition = 'width ' + SELECT_MS + 'ms linear';
    timerBar.style.width = '0%';

    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      if (Date.now() - timerStart >= SELECT_MS) {
        clearInterval(timerInterval);
        handleChoice(-1, -1);
      }
    }, 200);
  }

  function handleChoice(i, val) {
    if (answered || phase !== 'choosing') return;
    answered = true;
    clearInterval(timerInterval);
    timerBar.style.transition = 'none';

    const btns = choiceGrid.querySelectorAll('.choice-btn');
    btns.forEach(b => b.disabled = true);

    const count = state.dotCount;
    const off   = Math.abs(val - count);
    dotArea.className = '';

    if (val === -1) {
      // timeout
      state.lives--;
      state.streak = 0;
      gameArea.className = 'wrong';
      statusLabel.textContent = 'Time! The answer was ' + count;
    } else if (off === 0) {
      const mult = state.streak >= 10 ? 2 : state.streak >= 5 ? 1.5 : 1;
      const pts  = Math.round(50 * mult);
      state.score += pts;
      state.streak++;
      state.bestStreak = Math.max(state.bestStreak, state.streak);
      btns[i].classList.add('correct');
      gameArea.className = 'correct';
      statusLabel.textContent = 'Exact! +' + pts + ' pts 🎯';
    } else if (off === 1) {
      const pts = 20;
      state.score += pts;
      state.streak++;
      state.bestStreak = Math.max(state.bestStreak, state.streak);
      btns[i].classList.add('close');
      gameArea.className = 'correct';
      statusLabel.textContent = 'Close! ±1 → +' + pts + ' pts (was ' + count + ')';
    } else {
      state.lives--;
      state.streak = 0;
      btns[i].classList.add('wrong');
      gameArea.className = 'wrong';
      statusLabel.textContent = 'Wrong! The answer was ' + count;
      // reveal correct
      btns.forEach((b, bi) => {
        if (+b.textContent === count) b.classList.add('correct');
      });
    }

    state.round === ROUNDS && (state.lives > 0);
    updateHUD();
    phase = 'result';
    updateProgress();

    setTimeout(() => {
      if (state.lives <= 0 || state.round >= ROUNDS) { endGame(); return; }
      nextRound();
    }, state.lives <= 0 ? 1800 : 1500);
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
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

  document.addEventListener('keydown', e => {
    if (!endScreen.hidden) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startGame(); }
      return;
    }
    const map = { '1': 0, '2': 1, '3': 2, '4': 3 };
    if (map[e.key] !== undefined) {
      const btns = choiceGrid.querySelectorAll('.choice-btn');
      if (btns[map[e.key]]) btns[map[e.key]].click();
    }
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
