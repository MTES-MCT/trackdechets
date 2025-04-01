// Jest's object matching is too goddam annoying, throwing failures
// with hard-to-identify hidden spaces / tabs / line breaks
// Cleanse the strings before asserting on them
export const cleanse = (input: string) => {
  // Remove all kinds of hidden spaces (tabs, line breaks, etc.)
  let cleaned = input.replace(/\s+/g, " ");
  // Convert double spaces to single spaces
  cleaned = cleaned.replace(/ {2,}/g, " ");
  return cleaned.trim();
};
