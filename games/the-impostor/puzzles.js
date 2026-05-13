// impostor: index (0–3) of the word that does NOT share the hidden connection
const PUZZLES = [

  // ── EASY ──────────────────────────────────────────────────────────────────
  { words: ['CAT', 'DOG', 'EAGLE', 'CHAIR'],              impostor: 3, connection: 'The others are animals', difficulty: 1 },
  { words: ['RED', 'BLUE', 'HAPPY', 'GREEN'],              impostor: 2, connection: 'The others are colours', difficulty: 1 },
  { words: ['JANUARY', 'MARCH', 'FRIDAY', 'JULY'],         impostor: 2, connection: 'The others are months of the year', difficulty: 1 },
  { words: ['PARIS', 'BERLIN', 'ROME', 'TEXAS'],           impostor: 3, connection: 'The others are European capital cities', difficulty: 1 },
  { words: ['APPLE', 'BANANA', 'MANGO', 'CARROT'],         impostor: 3, connection: 'The others are fruits', difficulty: 1 },
  { words: ['PIANO', 'GUITAR', 'DRUMS', 'SPOON'],          impostor: 3, connection: 'The others are musical instruments', difficulty: 1 },
  { words: ['MARS', 'VENUS', 'SATURN', 'AFRICA'],          impostor: 3, connection: 'The others are planets in our solar system', difficulty: 1 },
  { words: ['MONDAY', 'THURSDAY', 'SATURDAY', 'FEBRUARY'], impostor: 3, connection: 'The others are days of the week', difficulty: 1 },
  { words: ['GOLD', 'SILVER', 'BRONZE', 'PLATINUM'],       impostor: 3, connection: 'The others are Olympic medal types', difficulty: 1 },
  { words: ['LION', 'TIGER', 'CHEETAH', 'ELEPHANT'],       impostor: 3, connection: 'The others are big cats', difficulty: 1 },
  { words: ['TRIANGLE', 'CIRCLE', 'SQUARE', 'CUBE'],       impostor: 3, connection: 'The others are 2D shapes — a cube is 3D', difficulty: 1 },
  { words: ['AMAZON', 'NILE', 'THAMES', 'EVEREST'],        impostor: 3, connection: 'The others are rivers — Everest is a mountain', difficulty: 1 },
  { words: ['TWITTER', 'INSTAGRAM', 'FACEBOOK', 'NETFLIX'], impostor: 3, connection: 'The others are social media platforms', difficulty: 1 },
  { words: ['STRAWBERRY', 'BLACKBERRY', 'RASPBERRY', 'BANANA'], impostor: 3, connection: 'The others are types of berry', difficulty: 1 },
  { words: ['HAMMER', 'SCREWDRIVER', 'WRENCH', 'CUCUMBER'], impostor: 3, connection: 'The others are tools', difficulty: 1 },
  { words: ['SWIMMING', 'ARCHERY', 'CHESS', 'GYMNASTICS'], impostor: 2, connection: 'The others are Olympic sports — chess is not', difficulty: 1 },
  { words: ['BREAKFAST', 'LUNCH', 'DINNER', 'APPETIZER'],  impostor: 3, connection: 'The others are full meals of the day', difficulty: 1 },
  { words: ['LONDON', 'PARIS', 'BERLIN', 'SYDNEY'],        impostor: 3, connection: "The others are European capitals — Sydney isn't even Australia's capital (Canberra is)", difficulty: 1 },
  { words: ['ROSE', 'TULIP', 'DAISY', 'FERN'],             impostor: 3, connection: 'The others are flowering plants — ferns never flower', difficulty: 1 },
  { words: ['SPAIN', 'ITALY', 'BRAZIL', 'GERMANY'],        impostor: 2, connection: 'The others are European countries', difficulty: 1 },
  { words: ['SHARK', 'SALMON', 'EAGLE', 'TUNA'],           impostor: 2, connection: 'The others are fish', difficulty: 1 },
  { words: ['COPPER', 'GOLD', 'SILVER', 'WOOD'],           impostor: 3, connection: 'The others are metals', difficulty: 1 },
  { words: ['SPRING', 'SUMMER', 'AUTUMN', 'EQUINOX'],      impostor: 3, connection: 'The others are seasons', difficulty: 1 },
  { words: ['VENUS', 'MARS', 'JUPITER', 'MOON'],           impostor: 3, connection: 'The others are planets — the Moon is a natural satellite, not a planet', difficulty: 1 },
  { words: ['CELLO', 'VIOLIN', 'HARP', 'TRUMPET'],         impostor: 3, connection: 'The others are stringed instruments', difficulty: 1 },
  { words: ['BED', 'BATH', 'KITCHEN', 'GARDEN'],           impostor: 3, connection: 'The others are rooms inside a house — a garden is outside', difficulty: 1 },

  // ── MEDIUM ────────────────────────────────────────────────────────────────
  { words: ['CAMP', 'CROSS', 'GUN', 'STONE'],              impostor: 3, connection: 'The others can precede FIRE — campfire, crossfire, gunfire', difficulty: 2 },
  { words: ['LENNON', 'TRAVOLTA', 'WAYNE', 'WICK'],        impostor: 3, connection: 'The others are real people named John — John Wick is fictional', difficulty: 2 },
  { words: ['STAR', 'LIVE', 'TRAP', 'BOOK'],               impostor: 3, connection: 'The others spell a real word backwards — RATS, EVIL, PART', difficulty: 2 },
  { words: ['OFTEN', 'FREIGHT', 'BONE', 'FENCE'],          impostor: 3, connection: 'The others hide a number — ofTEN, frEIGHT, bONE', difficulty: 2 },
  { words: ['KNIGHT', 'GNOME', 'WRAP', 'BREAD'],           impostor: 3, connection: 'The others begin with a silent letter — K, G, W', difficulty: 2 },
  { words: ['MURDER', 'PARLIAMENT', 'GAGGLE', 'HERD'],     impostor: 3, connection: 'The others are collective nouns for a specific animal — crows, owls, geese (herd is generic)', difficulty: 2 },
  { words: ['FEARLESS', 'REPUTATION', 'FOLKLORE', 'THUNDER'], impostor: 3, connection: 'The others are Taylor Swift albums', difficulty: 2 },
  { words: ['WESTERLY', 'SOUTHPAW', 'EASTWARD', 'LUNCHEON'], impostor: 3, connection: 'The others contain a compass direction — WEST, SOUTH, EAST', difficulty: 2 },
  { words: ['CUP', 'CHEESE', 'PAN', 'STAR'],               impostor: 3, connection: 'The others can precede CAKE — cupcake, cheesecake, pancake', difficulty: 2 },
  { words: ['DIAMOND', 'CLUB', 'HEART', 'JOKER'],          impostor: 3, connection: 'The others are suits in a deck of cards — the joker is not a suit', difficulty: 2 },
  { words: ['MERCURY', 'VENUS', 'MARS', 'EARTH'],          impostor: 3, connection: 'The others are planets named after Roman gods — Earth comes from Old English', difficulty: 2 },
  { words: ['PLUTO', 'MERCURY', 'SATURN', 'MARS'],         impostor: 0, connection: 'The others are recognised planets — Pluto was reclassified as a dwarf planet in 2006', difficulty: 2 },
  { words: ['HAMLET', 'OTHELLO', 'MACBETH', 'PROSPERO'],   impostor: 3, connection: 'The others are Shakespeare play titles — Prospero is a character in The Tempest, not a play', difficulty: 2 },
  { words: ['RADAR', 'LEVEL', 'RACECAR', 'LIVER'],         impostor: 3, connection: 'The others are palindromes — they read the same forwards and backwards', difficulty: 2 },
  { words: ['SCARLET', 'CRIMSON', 'MAGENTA', 'COBALT'],    impostor: 3, connection: 'The others are shades of red — cobalt is blue', difficulty: 2 },
  { words: ['FLOWER', 'KNIGHT', 'BEAR', 'STAR'],           impostor: 3, connection: 'The others have a common homophone — flour, night, bare', difficulty: 2 },
  { words: ['CLEAVE', 'SANCTION', 'DUST', 'HAPPY'],        impostor: 3, connection: 'The others are contronyms — words that contain two opposite meanings', difficulty: 2 },
  { words: ['TWO', 'THREE', 'FIVE', 'FOUR'],               impostor: 3, connection: 'The others are prime numbers — 4 divides by 2', difficulty: 2 },
  { words: ['SPRING', 'FLING', 'BRING', 'STRONG'],         impostor: 3, connection: 'The others rhyme with each other — -ING sound, not -ONG', difficulty: 2 },
  { words: ['PICASSO', 'DA VINCI', 'MONET', 'BEETHOVEN'],  impostor: 3, connection: 'The others are famous painters — Beethoven was a composer', difficulty: 2 },
  { words: ['INCH', 'FOOT', 'YARD', 'ACRE'],               impostor: 3, connection: 'The others are units of length — an acre measures area', difficulty: 2 },
  { words: ['ATLAS', 'TITAN', 'ZEUS', 'PROMETHEUS'],       impostor: 2, connection: 'The others are Titans in Greek mythology — Zeus is an Olympian god', difficulty: 2 },
  { words: ['CAPE', 'MASK', 'TIGHTS', 'SWORD'],            impostor: 3, connection: 'The others are things a superhero wears — a sword is a weapon', difficulty: 2 },
  { words: ['HERMIT', 'FIDDLER', 'HORSESHOE', 'COCONUT'],  impostor: 2, connection: 'The others are types of crab — hermit, fiddler, coconut crab', difficulty: 2 },

  // ── HARD ──────────────────────────────────────────────────────────────────
  { words: ['STRATEGY', 'PIGEON', 'MOLECULE', 'ABROAD'],   impostor: 3, connection: 'The others hide an animal — stRATegy, PIGeon, MOLEcule', difficulty: 3 },
  { words: ['PERUSE', 'MACHINATION', 'ASPIRANT', 'ABSOLUTE'], impostor: 3, connection: 'The others hide a country — PERUse, maCHINAtion, asPIRANt (Iran)', difficulty: 3 },
  { words: ['WOMAN', 'INCUBATE', 'PERUSE', 'WINDOW'],      impostor: 3, connection: 'The others hide a country — wOMAN (Oman), inCUBAte, PERUse', difficulty: 3 },
  { words: ['BUSINESS', 'ADVANTAGE', 'TRAINING', 'GARDEN'], impostor: 3, connection: 'The others hide a mode of transport — BUSiness, adVANtage, TRAINing', difficulty: 3 },
  { words: ['ELEPHANT', 'PLEASANT', 'RELEVANT', 'PLANET'],  impostor: 3, connection: 'The others end with the word ANT — elephANT, pleasANT, relevANT', difficulty: 3 },
  { words: ['TATTOO', 'RACCOON', 'COFFEE', 'CHEESE'],       impostor: 3, connection: 'The others each contain two different pairs of double letters — TT+OO, CC+OO, FF+EE', difficulty: 3 },
  { words: ['WHEAT', 'BLEND', 'CLAMP', 'FROWN'],            impostor: 3, connection: 'Remove the first letter of the others to get a new word — HEAT, LEND, LAMP', difficulty: 3 },
  { words: ['ABOARD', 'CARPET', 'PIGEON', 'WINDOW'],        impostor: 3, connection: 'The others hide an animal — aBOARd, CARPet, PIGeon', difficulty: 3 },
  { words: ['LISTEN', 'SILENT', 'ENLIST', 'FILTER'],        impostor: 3, connection: 'The others are anagrams of each other — all use L, I, S, T, E, N', difficulty: 3 },
  { words: ['EARTH', 'HEART', 'HATER', 'WATER'],            impostor: 3, connection: 'The others are anagrams of each other — all use E, A, R, T, H', difficulty: 3 },
  { words: ['EDUCATION', 'SCATTER', 'LOCATE', 'WINDOW'],    impostor: 3, connection: 'The others hide the animal CAT — eduCATion, sCATter, loCATE', difficulty: 3 },
  { words: ['FLOW', 'LOOP', 'SWAP', 'WORD'],                impostor: 3, connection: 'The others become a new word when reversed — WOLF, POOL, PAWS', difficulty: 3 },
  { words: ['BOOKKEEPER', 'TATTOO', 'RACCOON', 'EFFECT'],   impostor: 3, connection: 'The others contain multiple pairs of consecutive double letters — oo+kk+ee, tt+oo, cc+oo', difficulty: 3 },
  { words: ['STEAK', 'SKATE', 'TAKES', 'BREAD'],            impostor: 3, connection: 'The others are anagrams of each other — STEAK, SKATE, TAKES all share S, T, E, A, K', difficulty: 3 },
  { words: ['BILE', 'STRIDE', 'MOAT', 'LEMON'],             impostor: 3, connection: 'The others become a new word when you add a letter to the start — AGILE, ASTRIDE, GROAT... actually BILE→BILE... let me reconsider', difficulty: 3 },
];

// Drop the last placeholder puzzle
const VALID_PUZZLES = PUZZLES.slice(0, PUZZLES.length - 1);

function getPuzzles() {
  const easy   = shuffle(VALID_PUZZLES.filter(p => p.difficulty === 1));
  const medium = shuffle(VALID_PUZZLES.filter(p => p.difficulty === 2));
  const hard   = shuffle(VALID_PUZZLES.filter(p => p.difficulty === 3));
  return [...easy, ...medium, ...hard];
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
