export const getFrenchPublicHolidays = (year: number): string[] => {
  // Jours fériés à dates fixes
  const holidays = [
    `${year}-01-01`, // Jour de l'an
    `${year}-05-01`, // Fête du travail
    `${year}-05-08`, // Victoire 1945
    `${year}-07-14`, // Fête nationale / révolution
    `${year}-08-15`, // Assomption
    `${year}-11-01`, // Toussaint
    `${year}-11-11`, // Armistice 1918
    `${year}-12-25` // Noël
  ];

  // Calcul du Lundi de Pâques
  const easter = calculateEaster(year);
  const easterMonday = new Date(easter);
  easterMonday.setUTCDate(easterMonday.getUTCDate() + 1);
  holidays.push(easterMonday.toISOString().split("T")[0]);

  // Calcul de l'Ascension (39 jours après Pâques)
  const ascensionDay = new Date(easter);
  ascensionDay.setUTCDate(ascensionDay.getUTCDate() + 39);
  holidays.push(ascensionDay.toISOString().split("T")[0]);

  // Calcul du Lundi de Pentecôte (50 après Pâques)
  const whitMonday = new Date(easter);
  whitMonday.setUTCDate(whitMonday.getUTCDate() + 50);
  holidays.push(whitMonday.toISOString().split("T")[0]);

  return holidays;
};

const calculateEaster = (year: number): Date => {
  const f = Math.floor,
    G = year % 19,
    C = f(year / 100),
    H = (C - f(C / 4) - f((8 * C + 13) / 25) + 19 * G + 15) % 30,
    I = H - f(H / 28) * (1 - f(H / 28) * f(29 / (H + 1)) * f((21 - G) / 11)),
    J = (year + f(year / 4) + I + 2 - C + f(C / 4)) % 7,
    L = I - J,
    month = 3 + f((L + 40) / 44),
    day = L + 28 - 31 * f(month / 4);
  return new Date(Date.UTC(year, month - 1, day));
};

const isPublicHoliday = (date: Date): boolean => {
  const year = date.getUTCFullYear();
  const publicHolidays = getFrenchPublicHolidays(year);
  const formattedDate = date.toISOString().split("T")[0];
  return publicHolidays.includes(formattedDate);
};

/**
 * Méthode qui permet de récupérer le prochain jour ouvré. Elle exclue les week-ends
 * et les jours fériés nationaux (et pas locaux!)
 *
 * Il semblerait qu'il existe une API pour faire ça (https://api.gouv.fr/les-api/jours-feries),
 * mais elle a l'air bancale.
 */
export const getNextWorkday = (inputDate: Date): Date => {
  const resultDate = new Date(inputDate);
  resultDate.setUTCDate(resultDate.getUTCDate() + 1);

  // Check if the next day is a weekend or a public holiday
  while (
    resultDate.getUTCDay() === 0 ||
    resultDate.getUTCDay() === 6 ||
    isPublicHoliday(resultDate)
  ) {
    resultDate.setUTCDate(resultDate.getUTCDate() + 1);
  }

  return resultDate;
};
