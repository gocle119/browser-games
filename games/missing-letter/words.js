// Each entry: { word, blankIndex (0-indexed position of the missing letter), difficulty: 1|2|3 }
// Medium/hard entries mined from spell-it-right/words.js by diffing each word against its
// misspellings for same-length, single-character-substitution pairs — these are exactly the
// classic ambiguous-letter trouble spots (separate/seperate, calendar/calender, etc).
const WORDS = [
  // ── Easy (difficulty 1) ──────────────────────────────────────────────────
  { word: 'FRIEND',  blankIndex: 3, difficulty: 1 }, // FRI_ND (E)
  { word: 'BECAUSE', blankIndex: 3, difficulty: 1 }, // BEC_USE (A)
  { word: 'RECEIVE', blankIndex: 4, difficulty: 1 }, // RECE_VE (I)
  { word: 'WEIRD',   blankIndex: 2, difficulty: 1 }, // WE_RD (I)
  { word: 'ACHIEVE', blankIndex: 3, difficulty: 1 }, // ACH_EVE (I)
  { word: 'GRAMMAR', blankIndex: 5, difficulty: 1 }, // GRAMM_R (A)
  { word: 'PIECE',   blankIndex: 1, difficulty: 1 }, // P_ECE (I)
  { word: 'GARDEN',  blankIndex: 1, difficulty: 1 }, // G_RDEN (A)
  { word: 'WINDOW',  blankIndex: 1, difficulty: 1 }, // W_NDOW (I)
  { word: 'YELLOW',  blankIndex: 1, difficulty: 1 }, // Y_LLOW (E)
  { word: 'PURPLE',  blankIndex: 1, difficulty: 1 }, // P_RPLE (U)
  { word: 'ORANGE',  blankIndex: 2, difficulty: 1 }, // OR_NGE (A)
  { word: 'SILVER',  blankIndex: 1, difficulty: 1 }, // S_LVER (I)
  { word: 'GOLDEN',  blankIndex: 1, difficulty: 1 }, // G_LDEN (O)
  { word: 'CIRCLE',  blankIndex: 1, difficulty: 1 }, // C_RCLE (I)
  { word: 'SQUARE',  blankIndex: 2, difficulty: 1 }, // SQ_ARE (U)
  { word: 'MARKET',  blankIndex: 1, difficulty: 1 }, // M_RKET (A)
  { word: 'FOREST',  blankIndex: 1, difficulty: 1 }, // F_REST (O)
  { word: 'WINTER',  blankIndex: 1, difficulty: 1 }, // W_NTER (I)
  { word: 'SUMMER',  blankIndex: 1, difficulty: 1 }, // S_MMER (U)
  { word: 'AUTUMN',  blankIndex: 1, difficulty: 1 }, // A_TUMN (U)
  { word: 'PENCIL',  blankIndex: 1, difficulty: 1 }, // P_NCIL (E)
  { word: 'BOTTLE',  blankIndex: 1, difficulty: 1 }, // B_TTLE (O)
  { word: 'CASTLE',  blankIndex: 1, difficulty: 1 }, // C_STLE (A)
  { word: 'JACKET',  blankIndex: 1, difficulty: 1 }, // J_CKET (A)
  { word: 'BASKET',  blankIndex: 1, difficulty: 1 }, // B_SKET (A)
  { word: 'HAMMER',  blankIndex: 2, difficulty: 1 }, // HA_MER (M)
  { word: 'RABBIT',  blankIndex: 2, difficulty: 1 }, // RA_BIT (B)
  { word: 'LADDER',  blankIndex: 2, difficulty: 1 }, // LA_DER (D)
  { word: 'KITTEN',  blankIndex: 2, difficulty: 1 }, // KI_TEN (T)
  { word: 'RUBBER',  blankIndex: 2, difficulty: 1 }, // RU_BER (B)

  // ── Medium (difficulty 2) ────────────────────────────────────────────────
  { word: 'NECESSARY',   blankIndex: 3, difficulty: 2 }, // NEC_SSARY (E)
  { word: 'SEPARATE',    blankIndex: 3, difficulty: 2 }, // SEP_RATE (A)
  { word: 'DEFINITELY',  blankIndex: 5, difficulty: 2 }, // DEFIN_TELY (I)
  { word: 'OCCURRENCE',  blankIndex: 6, difficulty: 2 }, // OCCURR_NCE (E)
  { word: 'EMBARRASS',   blankIndex: 6, difficulty: 2 }, // EMBARR_SS (A)
  { word: 'CONSCIENCE',  blankIndex: 8, difficulty: 2 }, // CONSCIEN_E (C)
  { word: 'PRIVILEGE',   blankIndex: 6, difficulty: 2 }, // PRIVIL_GE (E)
  { word: 'VACUUM',      blankIndex: 3, difficulty: 2 }, // VAC_UM (U)
  { word: 'RELEVANT',    blankIndex: 5, difficulty: 2 }, // RELEV_NT (A)
  { word: 'INDEPENDENT', blankIndex: 8, difficulty: 2 }, // INDEPEND_NT (E)
  { word: 'CEMETERY',    blankIndex: 5, difficulty: 2 }, // CEMET_RY (E)
  { word: 'CATEGORY',    blankIndex: 3, difficulty: 2 }, // CAT_GORY (E)
  { word: 'CALENDAR',    blankIndex: 6, difficulty: 2 }, // CALEND_R (A)
  { word: 'NEIGHBOR',    blankIndex: 3, difficulty: 2 }, // NEI_HBOR (G)

  // ── Hard (difficulty 3) ──────────────────────────────────────────────────
  { word: 'ACCOMMODATE',   blankIndex: 6,  difficulty: 3 }, // ACCOMM_DATE (O)
  { word: 'MILLENNIUM',    blankIndex: 8,  difficulty: 3 }, // MILLENNI_M (U)
  { word: 'CONSCIENTIOUS', blankIndex: 8,  difficulty: 3 }, // CONSCIEN_IOUS (T)
  { word: 'SUPERSEDE',     blankIndex: 5,  difficulty: 3 }, // SUPER_EDE (S)
  { word: 'PERSEVERANCE',  blankIndex: 8,  difficulty: 3 }, // PERSEVER_NCE (A)
  { word: 'PARLIAMENT',    blankIndex: 7,  difficulty: 3 }, // PARLIAM_NT (E)
  { word: 'PRONUNCIATION', blankIndex: 4,  difficulty: 3 }, // PRON_NCIATION (U)
  { word: 'PLAYWRIGHT',    blankIndex: 6,  difficulty: 3 }, // PLAYWR_GHT (I)
  { word: 'MEMENTO',       blankIndex: 1,  difficulty: 3 }, // M_MENTO (E)
  { word: 'LEISURE',       blankIndex: 2,  difficulty: 3 }, // LE_SURE (I)
];

function getWords() {
  const a = [...WORDS];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
