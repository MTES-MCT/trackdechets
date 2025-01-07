export function pluralize(word: string, count: number | null | undefined) {
  return count && count > 1 ? `${word}s` : word;
}
