import { Context } from "../types";

export async function getReadableId(context: Context) {
  const beginningOfYear = new Date(new Date().getFullYear(), 0, 1);

  const forms = await context.prisma.forms({
    where: { createdAt_gte: beginningOfYear }
  });

  return `TD-${beginningOfYear
    .getFullYear()
    .toString()
    .slice(-2)}-${encodeNumber(forms.length + 1)}`;
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
