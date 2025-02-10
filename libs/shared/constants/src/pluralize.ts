export function pluralize(
  word: string,
  count: number | null | undefined,
  plural?: string
) {
  return count && count > 1 ? plural ?? `${word}s` : word;
}
