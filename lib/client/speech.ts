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

async function deviceVoice(lang: AnyLang): Promise<SpeechSynthesisVoice | undefined> {
  if (!canSpeak()) return undefined;
  const prefix = LANGS[lang].speech.slice(0, 2).toLowerCase();
  const voices = await loadVoices(window.speechSynthesis);
  return voices.find((v) => v.lang.toLowerCase().replace("_", "-").startsWith(prefix));
}

// Cloud clips cost an AI call each, so keep the ones already fetched this visit.
const MAX_CLIPS = 100;
const clips = new Map<string, Promise<string | null>>();
let playing: HTMLAudioElement | null = null;

function fetchClip(text: string, lang: AnyLang): Promise<string | null> {
  const key = `${lang}\n${text}`;
  const cached = clips.get(key);
  if (cached) return cached;

  const clip = fetch("/api/speak", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, lang }),
  })
    .then(async (response) => (response.ok ? URL.createObjectURL(await response.blob()) : null))
    .catch(() => null);
  clips.set(key, clip);
  // Failures are not kept, so the next tap tries again.
  clip.then((url) => url ?? clips.delete(key));

  if (clips.size > MAX_CLIPS) {
    const [oldestKey, oldest] = clips.entries().next().value!;
    clips.delete(oldestKey);
    oldest.then((url) => url && URL.revokeObjectURL(url));
  }
  return clip;
}

async function speakFromCloud(text: string, lang: AnyLang, rate: number): Promise<boolean> {
  const url = await fetchClip(text, lang);
  if (!url) return false;
  playing?.pause();
  const audio = new Audio(url);
  audio.playbackRate = rate;
  playing = audio;
  try {
    await audio.play();
    return true;
  } catch {
    return false;
  }
}

/**
 * Reads text aloud with the device's built-in voice for the language, or a
 * cloud voice when the device has none. Resolves to false when neither can
 * play, so the caller can say so.
 */
export async function speak(text: string, lang: AnyLang, rate = 0.85): Promise<boolean> {
  if (typeof window === "undefined" || !text.trim()) return false;
  const voice = await deviceVoice(lang);
  if (!voice) return speakFromCloud(text.trim().slice(0, 500), lang, rate);

  playing?.pause();
  const synth = window.speechSynthesis;
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = LANGS[lang].speech;
  utterance.rate = rate;
  utterance.voice = voice;
  synth.speak(utterance);
  return true;
}
