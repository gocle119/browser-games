const PlayCounter = (() => {
  const firebaseConfig = {
    apiKey: 'AIzaSyArtIn2IlrYkgUEmF9QGwW5ocquZbz88cE',
    authDomain: 'word-vault-f4a2d.firebaseapp.com',
    databaseURL: 'https://word-vault-f4a2d-default-rtdb.firebaseio.com',
    projectId: 'word-vault-f4a2d',
  };

  let db = null;
  function init() {
    if (db) return;
    try { firebase.initializeApp(firebaseConfig); } catch (e) {}
    db = firebase.database();
  }

  function increment(gameId) {
    try { init(); db.ref(`plays/${gameId}`).transaction(v => (v || 0) + 1); } catch (e) {}
  }

  async function getAll() {
    try { init(); return (await db.ref('plays').once('value')).val() || {}; } catch (e) { return {}; }
  }

  async function submitScore(gameId, name, score, streak) {
    init();
    await db.ref(`leaderboard/${gameId}`).push({
      name: name.slice(0, 10),
      score,
      streak,
      date: new Date().toISOString().slice(0, 10),
    });
  }

  async function getTopScores(gameId, limit = 10) {
    try {
      init();
      const snap = await db.ref(`leaderboard/${gameId}`)
        .orderByChild('score').limitToLast(limit).once('value');
      const entries = [];
      snap.forEach(c => entries.push(c.val()));
      return entries.sort((a, b) => b.score - a.score);
    } catch (e) { return []; }
  }

  return { increment, getAll, submitScore, getTopScores };
})();
