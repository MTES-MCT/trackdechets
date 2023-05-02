export const deduplicate = <T>(arr: T[]): T[] => Array.from(new Set(arr));
