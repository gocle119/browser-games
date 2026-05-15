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
    try {
      db = firebase.database();
    } catch (e) {
      console.error('[PlayCounter] firebase.database() failed:', e);
    }
  }

  function increment(gameId) {
    try {
      init();
      if (!db) { console.error('[PlayCounter] No DB — increment skipped'); return; }
      db.ref(`plays/${gameId}`)
        .set(firebase.database.ServerValue.increment(1))
        .then(() => console.log('[PlayCounter] increment ok:', gameId))
        .catch(e => console.error('[PlayCounter] increment failed:', e));
    } catch (e) { console.error('[PlayCounter] increment error:', e); }
  }

  async function getAll() {
    try {
      init();
      if (!db) return {};
      return (await db.ref('plays').once('value')).val() || {};
    } catch (e) { console.error('[PlayCounter] getAll failed:', e); return {}; }
  }

  async function submitScore(gameId, name, score, streak) {
    try {
      init();
      if (!db) throw new Error('No DB');
      await db.ref(`leaderboard/${gameId}`).push({
        name: name.slice(0, 10),
        score,
        streak,
        date: new Date().toISOString().slice(0, 10),
      });
      console.log('[PlayCounter] submitScore ok');
    } catch (e) { console.error('[PlayCounter] submitScore failed:', e); throw e; }
  }

  async function getTopScores(gameId, limit = 10) {
    try {
      init();
      if (!db) return [];
      const snap = await db.ref(`leaderboard/${gameId}`)
        .orderByChild('score').limitToLast(limit).once('value');
      const entries = [];
      snap.forEach(c => entries.push(c.val()));
      return entries.sort((a, b) => b.score - a.score);
    } catch (e) { console.error('[PlayCounter] getTopScores failed:', e); return []; }
  }

  return { increment, getAll, submitScore, getTopScores };
})();
