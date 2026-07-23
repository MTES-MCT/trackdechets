import { randomInt } from "node:crypto";

const UPPERCASE = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const LOWERCASE = "abcdefghijkmnopqrstuvwxyz";
const DIGITS = "23456789";

// Ensemble volontairement simple pour éviter les problèmes d'échappement.
const SPECIAL_CHARACTERS = "!@#$%*-_=+";

const ALL_CHARACTERS = UPPERCASE + LOWERCASE + DIGITS + SPECIAL_CHARACTERS;

function randomCharacter(characters: string): string {
  return characters[randomInt(0, characters.length)];
}

function shuffle(characters: string[]): string[] {
  for (let index = characters.length - 1; index > 0; index--) {
    const randomIndex = randomInt(0, index + 1);

    [characters[index], characters[randomIndex]] = [
      characters[randomIndex],
      characters[index]
    ];
  }

  return characters;
}

export function generateInseePassword(length = 24): string {
  if (length < 12) {
    throw new Error(
      "Un mot de passe INSEE doit contenir au moins 12 caractères"
    );
  }

  const password = [
    randomCharacter(UPPERCASE),
    randomCharacter(LOWERCASE),
    randomCharacter(DIGITS),
    randomCharacter(SPECIAL_CHARACTERS)
  ];

  while (password.length < length) {
    password.push(randomCharacter(ALL_CHARACTERS));
  }

  return shuffle(password).join("");
}
