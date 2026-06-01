// Each entry: { word, hint, difficulty: 1|2|3 }
// Letters are scrambled at runtime — no need to store them.
const WORDS = [
  // ── Easy (4–5 letters) ───────────────────────────────────────────────────
  { word: 'PALM',  hint: 'Tree found on beaches',          difficulty: 1 },
  { word: 'SWAN',  hint: 'Graceful white bird',             difficulty: 1 },
  { word: 'DUSK',  hint: 'Just after sunset',               difficulty: 1 },
  { word: 'COVE',  hint: 'Small sheltered bay',             difficulty: 1 },
  { word: 'GLEN',  hint: 'Narrow mountain valley',          difficulty: 1 },
  { word: 'HELM',  hint: 'Ship\'s steering wheel',          difficulty: 1 },
  { word: 'FERN',  hint: 'Leafy green plant',               difficulty: 1 },
  { word: 'MAST',  hint: 'Tall pole on a sailing ship',     difficulty: 1 },
  { word: 'GUST',  hint: 'Sudden burst of wind',            difficulty: 1 },
  { word: 'CLAM',  hint: 'Bivalve shellfish',               difficulty: 1 },
  { word: 'SMOG',  hint: 'City air pollution',              difficulty: 1 },
  { word: 'WICK',  hint: 'Thread inside a candle',          difficulty: 1 },
  { word: 'PERK',  hint: 'Extra job benefit',               difficulty: 1 },
  { word: 'HULK',  hint: 'Large, heavy body',               difficulty: 1 },
  { word: 'IRIS',  hint: 'Coloured ring of the eye',        difficulty: 1 },

  // ── Medium (5–6 letters) ─────────────────────────────────────────────────
  { word: 'BLAZE',  hint: 'Fierce fire',                    difficulty: 2 },
  { word: 'CRISP',  hint: 'Fresh and crunchy',              difficulty: 2 },
  { word: 'GRAZE',  hint: 'Cattle eating grass',            difficulty: 2 },
  { word: 'KNACK',  hint: 'Natural talent for something',   difficulty: 2 },
  { word: 'LUNAR',  hint: 'Relating to the moon',           difficulty: 2 },
  { word: 'PRANK',  hint: 'Playful trick',                  difficulty: 2 },
  { word: 'QUIRK',  hint: 'Unusual habit or feature',       difficulty: 2 },
  { word: 'SLOTH',  hint: 'Slow tree-hanging animal',       difficulty: 2 },
  { word: 'WALTZ',  hint: 'Elegant ballroom dance',         difficulty: 2 },
  { word: 'BRAWN',  hint: 'Physical strength',              difficulty: 2 },
  { word: 'FLINT',  hint: 'Stone used to make sparks',      difficulty: 2 },
  { word: 'GROAN',  hint: 'Sound of pain or displeasure',   difficulty: 2 },
  { word: 'DWARF',  hint: 'Mythical small creature',        difficulty: 2 },
  { word: 'PLUMB',  hint: 'Perfectly vertical',             difficulty: 2 },
  { word: 'TRYST',  hint: 'Secret romantic meeting',        difficulty: 2 },

  // ── Hard (6–8 letters) ───────────────────────────────────────────────────
  { word: 'SPHINX',  hint: 'Ancient Egyptian statue',         difficulty: 3 },
  { word: 'JIGSAW',  hint: 'Puzzle with interlocking pieces', difficulty: 3 },
  { word: 'PASTRY',  hint: 'Baked flaky dough',              difficulty: 3 },
  { word: 'OYSTER',  hint: 'Shellfish that makes pearls',     difficulty: 3 },
  { word: 'MAGNET',  hint: 'Attracts iron and steel',         difficulty: 3 },
  { word: 'MARVEL',  hint: 'Something wonderful',             difficulty: 3 },
  { word: 'CANOPY',  hint: 'Covering overhead',               difficulty: 3 },
  { word: 'CACTUS',  hint: 'Desert plant with spines',        difficulty: 3 },
  { word: 'TURNIP',  hint: 'Round root vegetable',            difficulty: 3 },
  { word: 'BISHOP',  hint: 'Chess piece or church leader',    difficulty: 3 },
  { word: 'FAMINE',  hint: 'Severe food shortage',            difficulty: 3 },
  { word: 'SUMMIT',  hint: 'Mountain peak or top meeting',    difficulty: 3 },
  { word: 'BALCONY', hint: 'Elevated outdoor platform',       difficulty: 3 },
  { word: 'LANTERN', hint: 'Portable light with a handle',    difficulty: 3 },
  { word: 'PILGRIM', hint: 'Traveller to a sacred place',     difficulty: 3 },
];

function getWords() {
  const a = [...WORDS];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
