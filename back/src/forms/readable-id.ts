import prisma from "../prisma";

export async function getReadableId() {
  const beginningOfYear = new Date(new Date().getFullYear(), 0, 1);
  const shortYear = beginningOfYear.getFullYear().toString().slice(-2);

  const mostRecentForms = await prisma.form.findMany({
    orderBy: { readableId: "desc" },
    take: 10
  });

  const latestFormReadableId = mostRecentForms[0]?.readableId;

  if (shortYear === latestFormReadableId?.slice(3, 5)) {
    const latestReadableIdAsNumber = decodeNumber(
      latestFormReadableId.slice(-8)
    );
    const nextEncodedNumber = encodeNumber(latestReadableIdAsNumber + 1);
    return `TD-${shortYear}-${nextEncodedNumber}`;
  }

  return `TD-${shortYear}-AAA00001`;
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
