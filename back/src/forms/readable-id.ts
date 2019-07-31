import { Context } from "../types";
import { string } from "yup";

export async function getReadableId(context: Context) {
  const beginningOfYear = new Date(new Date().getFullYear(), 0, 1);

  const mostRecentForms = await context.prisma.forms({
    orderBy: "readableId_DESC",
    first: 10
  });

  const latestFormReadableId = mostRecentForms[0].readableId;
  const latestReadableIdAsNumber = decodeNumber(latestFormReadableId.slice(-8));

  return `TD-${beginningOfYear
    .getFullYear()
    .toString()
    .slice(-2)}-${encodeNumber(latestReadableIdAsNumber + 1)}`;
}

// AAA12345
function encodeNumber(n): string {
  if (n <= 99999) {
    return `AAA${`0000${n}`.slice(-5)}`;
  }

  const letters = [`0000${n % 99999}`.slice(-5), "A", "A", "A"];
  let times = Math.floor(n / 99999);
  let i = 1;
  while (times > 0) {
    letters[i] = String.fromCharCode(97 + (times % 26)).toUpperCase();
    times = Math.floor(times / 26);
    i++;
  }

  return letters.reverse().join("");
}

function decodeNumber(n: string): number {
  const letters = n.slice(0, 3);
  const numbers = parseInt(n.slice(-5), 10);

  const multiplier = letters
    .split("")
    .reduce(
      (prev, cur, idx) =>
        prev + Math.pow(26, 2 - idx) * (cur.charCodeAt(0) - 65),
      0
    );

  return numbers + 99999 * multiplier;
}
