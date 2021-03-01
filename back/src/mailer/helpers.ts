const enum TemplateNames {
  MAIN = "MAIN",
  FIRST_ONBOARDING = "FIRST_ONBOARDING",
  PRODUCER_SECOND_ONBOARDING = "PRODUCER_SECOND_ONBOARDING",
  PROFESSIONAL_SECOND_ONBOARDING = "PROFESSIONAL_SECOND_ONBOARDING",
  SECURITY_CODE_RENEWAL = "SECURITY_CODE_RENEWAL"
}
type templateInterface = {
  [key in TemplateNames]: number;
};

export const templateIds: templateInterface = {
  [TemplateNames.MAIN]: parseInt(process.env.MAIN_TEMPLATE_ID, 10),
  [TemplateNames.FIRST_ONBOARDING]: parseInt(
    process.env.FIRST_ONBOARDING_TEMPLATE_ID,
    10
  ),
  [TemplateNames.PRODUCER_SECOND_ONBOARDING]: parseInt(
    process.env.PRODUCER_SECOND_ONBOARDING_TEMPLATE_ID,
    10
  ),
  [TemplateNames.PROFESSIONAL_SECOND_ONBOARDING]: parseInt(
    process.env.PROFESSIONAL_SECOND_ONBOARDING_TEMPLATE_ID,
    10
  ),
  [TemplateNames.SECURITY_CODE_RENEWAL]: parseInt(
    process.env.SECURITY_CODE_RENEWAL_TEMPLATE_ID,
    10
  )
};
const unwantedChars = /\*|\//g;
/**
 * Remove * and / special chars appearing on some individual companies
 * @param name string
 */
export const cleanupSpecialChars = (name: string): string => {
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
export const toFrFormat = (someDate: Date): string =>
  `${someDate.getDate()} ${
    frMonth[someDate.getMonth()]
  } ${someDate.getFullYear()}`;
