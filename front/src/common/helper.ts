/**
 * converts `aString` to `A_STRING`
 * @param string
 */
export function toMacroCase(string: string) {
  return string
    .split("")
    .map(c => (c.toUpperCase() === c ? `_${c.trim()}` : c))
    .join("")
    .replace(/_+/g, '_')
    .toUpperCase();
}
