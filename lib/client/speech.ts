import { LANGS, type AnyLang } from "../languages";

export const canSpeak = () => typeof window !== "undefined" && "speechSynthesis" in window;

/** Reads text aloud with the browser's built-in voice for the language. */
export function speak(text: string, lang: AnyLang, rate = 0.85) {
  if (!canSpeak()) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = LANGS[lang].speech;
  utterance.rate = rate;
  const voice = synth.getVoices().find((v) => v.lang.toLowerCase().startsWith(utterance.lang.slice(0, 2).toLowerCase()));
  if (voice) utterance.voice = voice;
  synth.speak(utterance);
}
