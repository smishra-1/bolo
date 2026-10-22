/**
 * The learning path, in order. `tier` is the placement level (1–3) the unit
 * belongs to: a learner placed at a higher level starts further along.
 * Unit ids may use only a–z and "_" (see the checks in supabase/schema.sql).
 */
export const UNITS = [
  // Tier 1: first words
  { id: "hello", emoji: "👋", tier: 1, seeds: ["hello", "goodbye", "please", "thank you", "yes", "no"] },
  { id: "colors", emoji: "🎨", tier: 1, seeds: ["red", "blue", "green", "yellow", "black", "white"] },
  { id: "animals", emoji: "🐾", tier: 1, seeds: ["cat", "dog", "bird", "fish", "horse", "cow"] },
  { id: "food", emoji: "🍎", tier: 1, seeds: ["apple", "bread", "water", "milk", "rice", "egg"] },
  { id: "family", emoji: "👨‍👩‍👧", tier: 1, seeds: ["mother", "father", "sister", "brother", "grandmother", "friend"] },
  { id: "numbers", emoji: "🔢", tier: 1, seeds: ["one", "two", "three", "four", "five", "ten"] },
  { id: "body", emoji: "🖐️", tier: 1, seeds: ["head", "hand", "foot", "eye", "ear", "mouth"] },
  { id: "school", emoji: "🎒", tier: 1, seeds: ["book", "pen", "teacher", "desk", "bag", "classroom"] },

  // Tier 2: everyday life
  { id: "fruits", emoji: "🍌", tier: 2, seeds: ["banana", "orange", "grapes", "mango", "strawberry", "watermelon"] },
  { id: "clothes", emoji: "👕", tier: 2, seeds: ["shirt", "shoes", "hat", "jacket", "socks", "dress"] },
  { id: "home", emoji: "🏠", tier: 2, seeds: ["house", "door", "window", "bed", "kitchen", "table"] },
  { id: "weather", emoji: "⛅", tier: 2, seeds: ["sun", "rain", "wind", "snow", "cloud", "hot"] },
  { id: "days", emoji: "📅", tier: 2, seeds: ["Monday", "Friday", "Sunday", "today", "tomorrow", "yesterday"] },
  { id: "places", emoji: "🏙️", tier: 2, seeds: ["park", "shop", "hospital", "library", "market", "beach"] },
  { id: "feelings", emoji: "😊", tier: 2, seeds: ["happy", "sad", "tired", "angry", "scared", "excited"] },
  { id: "transport", emoji: "🚌", tier: 2, seeds: ["car", "bus", "train", "bicycle", "airplane", "boat"] },

  // Tier 3: talking with people
  { id: "shopping", emoji: "🛍️", tier: 3, seeds: ["how much is it", "expensive", "cheap", "money", "I want this", "big"] },
  { id: "restaurant", emoji: "🍽️", tier: 3, seeds: ["menu", "I would like", "the bill", "delicious", "a table for two", "spoon"] },
  { id: "jobs", emoji: "🧑‍🚀", tier: 3, seeds: ["doctor", "farmer", "driver", "singer", "scientist", "chef"] },
  { id: "nature", emoji: "🌳", tier: 3, seeds: ["tree", "flower", "river", "mountain", "sea", "moon"] },
  { id: "sports", emoji: "⚽", tier: 3, seeds: ["football", "swimming", "to run", "to win", "team", "ball"] },
  { id: "hobbies", emoji: "🎸", tier: 3, seeds: ["music", "to draw", "to read", "to dance", "to play", "photo"] },
  { id: "health", emoji: "🩺", tier: 3, seeds: ["I am sick", "my head hurts", "medicine", "fever", "rest", "healthy"] },
  { id: "travel", emoji: "🧳", tier: 3, seeds: ["where is the station", "ticket", "passport", "left", "right", "I am lost"] },
] as const;

export type Unit = (typeof UNITS)[number];
export type UnitId = Unit["id"];

export function getUnit(id: string): Unit | undefined {
  return UNITS.find((unit) => unit.id === id);
}

/** Position of the first unit of each tier, indexed by tier (1–3). */
export function tierStart(tier: number): number {
  const index = UNITS.findIndex((unit) => unit.tier >= tier);
  return index === -1 ? UNITS.length - 1 : index;
}
