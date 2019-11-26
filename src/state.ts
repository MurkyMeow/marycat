export type StateOrPlain<T> = T | (() => T)

export const zipTemplate = (cb: (template: string) => void) => (
  strings: TemplateStringsArray, ...keys: string[]
): void => cb(strings
  .reduce((acc, str, i) => `${acc}${str}${keys[i] || ''}`)
)

