(() => {
  const GAME_ID   = 'unscramble';
  const LIVES_MAX = 3;

  let state = {};
  let timerInterval = null;
  let timerStart    = null;
  let timeLimit     = 0;
  let puzzle        = null;
  let scrambled     = []; // letters in scrambled order (by srcIdx)
  let placed        = new Set(); // srcIdx values currently in answer row
  let answer        = []; // { letter, srcIdx } in tap order
  let inputLocked   = false;

  const livesEl    = document.getElementById('lives');
  const scoreEl    = document.getElementById('score');
  const streakEl   = document.getElementById('streak');
  const timerBar   = document.getElementById('timer-bar');
  const gameArea   = document.getElementById('game-area');
  const hintLabel  = document.getElementById('hint-label');
  const answerRow  = document.getElementById('answer-row');
  const tilePool   = document.getElementById('tile-pool');
  const clearBtn   = document.getElementById('btn-clear');
  const endScreen  = document.getElementById('end-screen');
  const endScore   = document.getElementById('end-score');
  const endStreak  = document.getElementById('end-streak');
  const endBest    = document.getElementById('end-best');
  const leaderboardEl = document.getElementById('leaderboard');

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function scrambleWord(word) {
    const letters = word.split('');
    let result;
    // Keep shuffling until the result isn't the same as the original
    do { result = shuffle(letters); } while (result.join('') === word);
    return result;
  }

  function startGame() {
    clearInterval(timerInterval);
    PlayCounter.increment(GAME_ID);
    state = {
      words:      getWords(),
      index:      0,
      score:      0,
      streak:     0,
      bestStreak: 0,
      lives:      LIVES_MAX,
    };
    endScreen.hidden = true;
    gameArea.hidden  = false;
    updateHUD();
    nextPuzzle();
  }

  function nextPuzzle() {
    if (state.index >= state.words.length) { endGame(); return; }

    puzzle    = state.words[state.index];
    timeLimit = puzzle.word.length * 3500;
    scrambled = scrambleWord(puzzle.word);
    placed    = new Set();
    answer    = [];
    inputLocked = false;

    hintLabel.textContent = puzzle.hint;
    renderAnswerRow();
    renderTilePool();
    startTimer(timeLimit);
  }

  function renderAnswerRow() {
    answerRow.innerHTML = '';
    answerRow.className = 'answer-row';

    // Scale tile size so the answer row fits on screen
    const available = Math.min(window.innerWidth - 40, 480);
    const size = Math.max(36, Math.min(56, Math.floor((available - (puzzle.word.length - 1) * 6) / puzzle.word.length)));
    gameArea.style.setProperty('--tile-sz', size + 'px');

    for (let i = 0; i < puzzle.word.length; i++) {
      const slot = document.createElement('div');
      slot.className = 'answer-slot';
      slot.dataset.pos = i;
      answerRow.appendChild(slot);
    }
  }

  function renderTilePool() {
    tilePool.innerHTML = '';
    scrambled.forEach((letter, idx) => {
      const btn = document.createElement('button');
      btn.className = 'pool-tile';
      btn.textContent = letter;
      btn.dataset.idx = idx;
      btn.addEventListener('click', () => onPoolTap(idx));
      tilePool.appendChild(btn);
    });
  }

  function onPoolTap(srcIdx) {
    if (inputLocked) return;
    if (placed.has(srcIdx)) return;
    if (answer.length >= puzzle.word.length) return;

    placed.add(srcIdx);
    answer.push({ letter: scrambled[srcIdx], srcIdx });

    tilePool.querySelector('[data-idx="' + srcIdx + '"]').classList.add('used');

    const slot = answerRow.children[answer.length - 1];
    slot.textContent = scrambled[srcIdx];
    slot.classList.add('filled');

    if (answer.length === puzzle.word.length) {
      checkAnswer();
    }
  }

  function clearAnswer() {
    if (inputLocked) return;
    placed.clear();
    answer = [];
    tilePool.querySelectorAll('.pool-tile').forEach(t => t.classList.remove('used'));
    Array.from(answerRow.children).forEach(s => {
      s.textContent = '';
      s.className = 'answer-slot';
    });
  }

  function checkAnswer() {
    inputLocked = true;
    clearInterval(timerInterval);
    const userWord = answer.map(a => a.letter).join('');

    if (userWord === puzzle.word) {
      const elapsed = Date.now() - timerStart;
      const base  = 10 * puzzle.word.length;
      const bonus = elapsed < timeLimit * 0.4 ? Math.round(base * 0.5) : 0;
      const mult  = state.streak >= 10 ? 2 : state.streak >= 5 ? 1.5 : 1;
      const pts   = Math.round((base + bonus) * mult);

      state.score += pts;
      state.streak++;
      state.bestStreak = Math.max(state.bestStreak, state.streak);
      updateHUD();

      Array.from(answerRow.children).forEach(s => s.classList.add('correct'));
      state.index++;
      setTimeout(() => {
        if (state.lives <= 0 || state.index >= state.words.length) endGame();
        else nextPuzzle();
      }, 1000);
    } else {
      state.lives--;
      state.streak = 0;
      updateHUD();

      Array.from(answerRow.children).forEach(s => s.classList.add('wrong'));
      answerRow.classList.add('shake');
      answerRow.addEventListener('animationend', () => {
        answerRow.className = 'answer-row';
        Array.from(answerRow.children).forEach(s => { s.className = 'answer-slot'; s.textContent = ''; });
        placed.clear();
        answer = [];
        tilePool.querySelectorAll('.pool-tile').forEach(t => t.classList.remove('used'));
        inputLocked = false;
        if (state.lives <= 0) {
          // Show the correct word then end
          Array.from(answerRow.children).forEach((s, i) => {
            s.textContent = puzzle.word[i];
            s.className = 'answer-slot filled';
          });
          state.index++;
          setTimeout(endGame, 1500);
        } else {
          startTimer(timeLimit); // restart timer for same puzzle
        }
      }, { once: true });
    }
  }

  function startTimer(ms) {
    clearInterval(timerInterval);
    timerStart = Date.now();
    timerBar.style.transition = 'none';
    timerBar.style.width = '100%';
    void timerBar.offsetWidth;
    timerBar.style.transition = 'width ' + ms + 'ms linear';
    timerBar.style.width = '0%';

    timerInterval = setInterval(() => {
      if (inputLocked) return;
      if (Date.now() - timerStart >= ms) {
        clearInterval(timerInterval);
        inputLocked = true;
        state.lives--;
        state.streak = 0;
        updateHUD();
        // Reveal correct word in slots
        Array.from(answerRow.children).forEach((s, i) => {
          s.textContent = puzzle.word[i];
          s.className = 'answer-slot wrong';
        });
        state.index++;
        setTimeout(() => {
          if (state.lives <= 0 || state.index >= state.words.length) endGame();
          else nextPuzzle();
        }, 1400);
      }
    }, 200);
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
      '<div class="lb-row ' + (i===0?'lb-top':'') + '">' +
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
        '<div class="lb-row ' + (i===0?'lb-top':'') + '">' +
          '<span class="lb-rank">' + (i===0?'🥇':i===1?'🥈':i===2?'🥉':'#'+(i+1)) + '</span>' +
          '<span class="lb-name">' + escapeHtml(e.name) + '</span>' +
          '<span class="lb-score">' + e.score + '</span>' +
          '<span class="lb-meta">streak ' + e.streak + ' · ' + e.date + '</span>' +
        '</div>'
      ).join('');
    });
  }

  clearBtn.addEventListener('click', clearAnswer);

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

  document.addEventListener('keydown', e => {
    if (!endScreen.hidden) {
      if (e.key === 'Enter' || e.key === ' ') startGame();
      return;
    }
    if (e.key === 'Backspace') clearAnswer();
  });

  startGame();
})();
