import { LANGS, type AnyLang } from "../languages";

export const canSpeak = () => typeof window !== "undefined" && "speechSynthesis" in window;

/** Browsers load their voice list lazily: it is empty on the first call and fills in a moment later. */
function loadVoices(synth: SpeechSynthesis): Promise<SpeechSynthesisVoice[]> {
  const ready = synth.getVoices();
  if (ready.length) return Promise.resolve(ready);
  return new Promise((resolve) => {
    const done = () => {
      synth.removeEventListener("voiceschanged", done);
      clearTimeout(timer);
      resolve(synth.getVoices());
    };
    const timer = setTimeout(done, 1500);
    synth.addEventListener("voiceschanged", done);
  });
}

/**
 * Reads text aloud with the browser's built-in voice for the language.
 * Resolves to false when this device has no voice for the language, so the caller can say so.
 */
export async function speak(text: string, lang: AnyLang, rate = 0.85): Promise<boolean> {
  if (!canSpeak()) return false;
  const synth = window.speechSynthesis;
  const code = LANGS[lang].speech;
  const voices = await loadVoices(synth);
  const voice = voices.find((v) => v.lang.toLowerCase().replace("_", "-").startsWith(code.slice(0, 2).toLowerCase()));
  if (!voice) return false;
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = code;
  utterance.rate = rate;
  utterance.voice = voice;
  synth.speak(utterance);
  return true;
}
