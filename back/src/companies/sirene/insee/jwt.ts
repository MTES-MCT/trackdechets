type InseeJwtPayload = {
  exp?: number;
  pwdChangedTime?: string;
};

function decodeBase64Url(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

export function decodeInseeJwt(token: string): InseeJwtPayload {
  const parts = token.split(".");

  if (parts.length !== 3) {
    throw new Error("Le token INSEE n'est pas un JWT valide");
  }

  try {
    return JSON.parse(decodeBase64Url(parts[1])) as InseeJwtPayload;
  } catch {
    throw new Error("Impossible de décoder le token JWT INSEE");
  }
}

/**
 * Exemple INSEE : 20260206145508Z
 */
export function parsePwdChangedTime(value: string): Date {
  const match = value.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})Z$/);

  if (!match) {
    throw new Error(`Format pwdChangedTime INSEE invalide : ${value}`);
  }

  const [, year, month, day, hour, minute, second] = match;

  const date = new Date(
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second)
    )
  );

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Date pwdChangedTime INSEE invalide : ${value}`);
  }

  return date;
}

export function getPasswordAgeInDays(token: string, now = new Date()): number {
  const payload = decodeInseeJwt(token);

  if (!payload.pwdChangedTime) {
    throw new Error("Le champ pwdChangedTime est absent du token JWT INSEE");
  }

  const changedAt = parsePwdChangedTime(payload.pwdChangedTime);

  return Math.floor(
    (now.getTime() - changedAt.getTime()) / (24 * 60 * 60 * 1000)
  );
}
