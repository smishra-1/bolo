export const UNITS = [
  { id: "hello", emoji: "👋", seeds: ["hello", "goodbye", "please", "thank you", "yes", "no"] },
  { id: "colors", emoji: "🎨", seeds: ["red", "blue", "green", "yellow", "black", "white"] },
  { id: "animals", emoji: "🐾", seeds: ["cat", "dog", "bird", "fish", "horse", "cow"] },
  { id: "food", emoji: "🍎", seeds: ["apple", "bread", "water", "milk", "rice", "egg"] },
  { id: "family", emoji: "👨‍👩‍👧", seeds: ["mother", "father", "sister", "brother", "grandmother", "friend"] },
  { id: "numbers", emoji: "🔢", seeds: ["one", "two", "three", "four", "five", "ten"] },
] as const;

export type Unit = (typeof UNITS)[number];
export type UnitId = Unit["id"];

export function getUnit(id: string): Unit | undefined {
  return UNITS.find((unit) => unit.id === id);
}
