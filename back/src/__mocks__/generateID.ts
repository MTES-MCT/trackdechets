let id = -1;

export function generateID(prefix: string) {
  id += 1;
  return `${prefix}-${id}`;
}
