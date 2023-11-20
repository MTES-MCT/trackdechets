const unwantedChars = /\*|\//g;
/**
 * Remove * and / special chars appearing on some individual companies
 * @param name string
 */
export const cleanupSpecialChars = (
  name: string | null | undefined
): string => {
  if (!name) {
    return "";
  }
  return name.replace(unwantedChars, " ").trim();
};

const frMonth = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre"
];
/**
 * Format a date as fr verbose format
 * @param someDate Date
 */
export const toFrFormat = (date: Date): string => {
  return `${date.getDate()} ${frMonth[date.getMonth()]} ${date.getFullYear()}`;
};

/**
 * Will split an array into smaller arrays of max size maxChunkSize
 */
export const splitArrayIntoChunks = <T>(arr: T[], maxChunkSize: number) => {
  if (!arr.length) {
    return [[]];
  }

  const result: T[][] = [];

  for (let i = 0; i < arr.length; i += maxChunkSize) {
    const chunk = arr.slice(i, i + maxChunkSize);
    result.push(chunk);
  }

  return result;
};

/**
 * Method to sanitize user inputs and prevent attacks like SSTI. 
 * This will simply remove special chars from the string, except:
 * - '-' for names like Jean-Edouard
 * - '_' for emails like jean_edouard@mail.com
 * - '.' for emails like jean.edouard@mail.com
 * - '@' for emails
 * 
 * Based on https://stackoverflow.com/questions/4374822/remove-all-special-characters-with-regexp
 */
export const sanitize = (str: string): string => str.replace(/[`~!#$%^&*()|+=?;:'",<>\{\}\[\]\\\/]/gi, '');