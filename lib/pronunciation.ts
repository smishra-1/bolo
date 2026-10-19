export type LetterResult = { char: string; ok: boolean };

export type PronunciationResult = {
  letters: LetterResult[];
  /** Share of the target's letters that were heard, 0–1. */
  score: number;
  /** First letter that was missed, if any. */
  firstMiss: string | null;
};

const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });

/** Visible letters, keeping combined marks (é, कि) together as one letter. */
function graphemes(text: string): string[] {
  return Array.from(segmenter.segment(text), (s) => s.segment);
}

/** Lower-case and strip Latin accents so "Él" compares equal to "el". */
function fold(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").normalize("NFC").toLocaleLowerCase();
}

const isLetter = (g: string) => /[\p{L}\p{N}]/u.test(g);

/**
 * Marks each letter of the target as heard or missed by aligning it with the
 * transcript (longest common subsequence).
 */
export function comparePronunciation(target: string, heard: string): PronunciationResult {
  const displayed = graphemes(target).filter(isLetter);
  const a = displayed.map(fold);
  const b = graphemes(heard).filter(isLetter).map(fold);

  const dp: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const ok = new Array<boolean>(a.length).fill(false);
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      ok[i] = true;
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      i++;
    } else {
      j++;
    }
  }

  const letters = displayed.map((char, index) => ({ char, ok: ok[index] }));
  const matched = letters.filter((l) => l.ok).length;
  return {
    letters,
    score: letters.length === 0 ? 0 : matched / letters.length,
    firstMiss: letters.find((l) => !l.ok)?.char ?? null,
  };
}
