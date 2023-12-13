/**
 * List "external" templates from the mail provider
 * The template ids are retrieved from provider and passed as config
 */

const enum TemplateNames {
  LAYOUT = "LAYOUT",
  FIRST_ONBOARDING = "FIRST_ONBOARDING",
  PRODUCER_SECOND_ONBOARDING = "PRODUCER_SECOND_ONBOARDING",
  PROFESIONAL_SECOND_ONBOARDING = "PROFESIONAL_SECOND_ONBOARDING",
  VERIFIED_FOREIGN_TRANSPORTER_COMPANY = "VERIFIED_FOREIGN_TRANSPORTER_COMPANY"
}
type templateInterface = {
  [key in TemplateNames]: number;
};

export const templateIds: templateInterface = {
  [TemplateNames.LAYOUT]: parseInt(process.env.MAIN_TEMPLATE_ID, 10),
  [TemplateNames.FIRST_ONBOARDING]: parseInt(
    process.env.FIRST_ONBOARDING_TEMPLATE_ID,
    10
  ),
  [TemplateNames.PRODUCER_SECOND_ONBOARDING]: parseInt(
    process.env.PRODUCER_SECOND_ONBOARDING_TEMPLATE_ID,
    10
  ),
  [TemplateNames.PROFESIONAL_SECOND_ONBOARDING]: parseInt(
    process.env.PROFESIONAL_SECOND_ONBOARDING_TEMPLATE_ID,
    10
  ),
  [TemplateNames.VERIFIED_FOREIGN_TRANSPORTER_COMPANY]: parseInt(
    process.env.VERIFIED_FOREIGN_TRANSPORTER_COMPANY_TEMPLATE_ID,
    10
  )
};
