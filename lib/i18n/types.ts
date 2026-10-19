import type { en } from "./en";

type Widen<T> = T extends string
  ? string
  : T extends readonly string[]
    ? string[]
    : { [K in keyof T]: Widen<T[K]> };

/** Every locale must provide exactly the keys of the English dictionary. */
export type Messages = Widen<typeof en>;
