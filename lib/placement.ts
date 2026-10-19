import type { NativeLang, TargetLang } from "./languages";

type Term = { text: string; roman?: string };

type Concept = {
  id: string;
  emoji: string;
  difficulty: 1 | 2 | 3;
  gloss: Record<NativeLang, string>;
  terms: Record<TargetLang, Term>;
};

export const CONCEPTS: Concept[] = [
  {
    id: "cat", emoji: "🐱", difficulty: 1,
    gloss: { en: "cat", hi: "बिल्ली", es: "gato", fr: "chat", de: "Katze", ja: "ねこ" },
    terms: { es: { text: "gato" }, fr: { text: "chat" }, de: { text: "Katze" }, ja: { text: "ねこ", roman: "neko" }, hi: { text: "बिल्ली", roman: "billi" } },
  },
  {
    id: "dog", emoji: "🐶", difficulty: 1,
    gloss: { en: "dog", hi: "कुत्ता", es: "perro", fr: "chien", de: "Hund", ja: "いぬ" },
    terms: { es: { text: "perro" }, fr: { text: "chien" }, de: { text: "Hund" }, ja: { text: "いぬ", roman: "inu" }, hi: { text: "कुत्ता", roman: "kutta" } },
  },
  {
    id: "water", emoji: "💧", difficulty: 1,
    gloss: { en: "water", hi: "पानी", es: "agua", fr: "eau", de: "Wasser", ja: "みず" },
    terms: { es: { text: "agua" }, fr: { text: "eau" }, de: { text: "Wasser" }, ja: { text: "みず", roman: "mizu" }, hi: { text: "पानी", roman: "paani" } },
  },
  {
    id: "hello", emoji: "👋", difficulty: 1,
    gloss: { en: "hello", hi: "नमस्ते", es: "hola", fr: "bonjour", de: "hallo", ja: "こんにちは" },
    terms: { es: { text: "hola" }, fr: { text: "bonjour" }, de: { text: "hallo" }, ja: { text: "こんにちは", roman: "konnichiwa" }, hi: { text: "नमस्ते", roman: "namaste" } },
  },
  {
    id: "red", emoji: "🔴", difficulty: 1,
    gloss: { en: "red", hi: "लाल", es: "rojo", fr: "rouge", de: "rot", ja: "あか" },
    terms: { es: { text: "rojo" }, fr: { text: "rouge" }, de: { text: "rot" }, ja: { text: "あか", roman: "aka" }, hi: { text: "लाल", roman: "laal" } },
  },
  {
    id: "house", emoji: "🏠", difficulty: 2,
    gloss: { en: "house", hi: "घर", es: "casa", fr: "maison", de: "Haus", ja: "いえ" },
    terms: { es: { text: "casa" }, fr: { text: "maison" }, de: { text: "Haus" }, ja: { text: "いえ", roman: "ie" }, hi: { text: "घर", roman: "ghar" } },
  },
  {
    id: "apple", emoji: "🍎", difficulty: 2,
    gloss: { en: "apple", hi: "सेब", es: "manzana", fr: "pomme", de: "Apfel", ja: "りんご" },
    terms: { es: { text: "manzana" }, fr: { text: "pomme" }, de: { text: "Apfel" }, ja: { text: "りんご", roman: "ringo" }, hi: { text: "सेब", roman: "seb" } },
  },
  {
    id: "book", emoji: "📖", difficulty: 2,
    gloss: { en: "book", hi: "किताब", es: "libro", fr: "livre", de: "Buch", ja: "ほん" },
    terms: { es: { text: "libro" }, fr: { text: "livre" }, de: { text: "Buch" }, ja: { text: "ほん", roman: "hon" }, hi: { text: "किताब", roman: "kitaab" } },
  },
  {
    id: "thanks", emoji: "🙏", difficulty: 2,
    gloss: { en: "thank you", hi: "धन्यवाद", es: "gracias", fr: "merci", de: "danke", ja: "ありがとう" },
    terms: { es: { text: "gracias" }, fr: { text: "merci" }, de: { text: "danke" }, ja: { text: "ありがとう", roman: "arigatou" }, hi: { text: "धन्यवाद", roman: "dhanyavaad" } },
  },
  {
    id: "sun", emoji: "☀️", difficulty: 2,
    gloss: { en: "sun", hi: "सूरज", es: "sol", fr: "soleil", de: "Sonne", ja: "たいよう" },
    terms: { es: { text: "sol" }, fr: { text: "soleil" }, de: { text: "Sonne" }, ja: { text: "たいよう", roman: "taiyou" }, hi: { text: "सूरज", roman: "sooraj" } },
  },
  {
    id: "good_night", emoji: "🌙", difficulty: 3,
    gloss: { en: "good night", hi: "शुभ रात्रि", es: "buenas noches", fr: "bonne nuit", de: "gute Nacht", ja: "おやすみ" },
    terms: { es: { text: "buenas noches" }, fr: { text: "bonne nuit" }, de: { text: "gute Nacht" }, ja: { text: "おやすみ", roman: "oyasumi" }, hi: { text: "शुभ रात्रि", roman: "shubh raatri" } },
  },
  {
    id: "hungry", emoji: "🍽️", difficulty: 3,
    gloss: { en: "I am hungry", hi: "मुझे भूख लगी है", es: "tengo hambre", fr: "j'ai faim", de: "ich habe Hunger", ja: "おなかがすいた" },
    terms: { es: { text: "tengo hambre" }, fr: { text: "j'ai faim" }, de: { text: "ich habe Hunger" }, ja: { text: "おなかがすいた", roman: "onaka ga suita" }, hi: { text: "मुझे भूख लगी है", roman: "mujhe bhookh lagi hai" } },
  },
  {
    id: "tomorrow", emoji: "📅", difficulty: 3,
    gloss: { en: "see you tomorrow", hi: "कल मिलते हैं", es: "hasta mañana", fr: "à demain", de: "bis morgen", ja: "またあした" },
    terms: { es: { text: "hasta mañana" }, fr: { text: "à demain" }, de: { text: "bis morgen" }, ja: { text: "またあした", roman: "mata ashita" }, hi: { text: "कल मिलते हैं", roman: "kal milte hain" } },
  },
  {
    id: "how_are_you", emoji: "🙂", difficulty: 3,
    gloss: { en: "how are you?", hi: "आप कैसे हैं?", es: "¿cómo estás?", fr: "comment ça va ?", de: "wie geht's?", ja: "げんきですか" },
    terms: { es: { text: "¿cómo estás?" }, fr: { text: "comment ça va ?" }, de: { text: "wie geht's?" }, ja: { text: "げんきですか", roman: "genki desu ka" }, hi: { text: "आप कैसे हैं?", roman: "aap kaise hain" } },
  },
];

export const PLACEMENT_LENGTH = 5;

export type PlacementQuestion = {
  conceptId: string;
  emoji: string;
  difficulty: 1 | 2 | 3;
  prompt: string;
  options: Term[];
  answerIndex: number;
};

export type PlacementAnswer = { difficulty: number; correct: boolean };

function shuffle<T>(items: T[], random: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Correct answers move up a level, wrong answers move down. */
export function nextDifficulty(current: number, correct: boolean): 1 | 2 | 3 {
  const next = correct ? current + 1 : current - 1;
  return Math.min(3, Math.max(1, next)) as 1 | 2 | 3;
}

/** Picks an unused concept at the given difficulty and builds three options. */
export function buildQuestion(
  target: TargetLang,
  native: NativeLang,
  difficulty: 1 | 2 | 3,
  usedIds: string[],
  random: () => number = Math.random,
): PlacementQuestion {
  const unused = CONCEPTS.filter((c) => !usedIds.includes(c.id));
  const atLevel = unused.filter((c) => c.difficulty === difficulty);
  const pool = atLevel.length > 0 ? atLevel : unused.length > 0 ? unused : CONCEPTS;
  const concept = pool[Math.floor(random() * pool.length)];

  const distractors = shuffle(
    CONCEPTS.filter((c) => c.id !== concept.id && c.difficulty === concept.difficulty),
    random,
  ).slice(0, 2);
  const options = shuffle([concept, ...distractors], random);

  return {
    conceptId: concept.id,
    emoji: concept.emoji,
    difficulty: concept.difficulty,
    prompt: concept.gloss[native],
    options: options.map((c) => c.terms[target]),
    answerIndex: options.indexOf(concept),
  };
}

/**
 * Level 1–3 from the answers so far: the hardest difficulty answered
 * correctly, lowered by one if more than half the answers were wrong.
 */
export function estimateLevel(answers: PlacementAnswer[]): 1 | 2 | 3 {
  const correct = answers.filter((a) => a.correct);
  if (correct.length === 0) return 1;
  const hardest = Math.max(...correct.map((a) => a.difficulty));
  const mostlyWrong = correct.length * 2 < answers.length;
  return Math.min(3, Math.max(1, hardest - (mostlyWrong ? 1 : 0))) as 1 | 2 | 3;
}
