/**
 * List "external" templates from the mail provider
 * The template ids are retrieved from provider and passed as config
 */

const enum TemplateNames {
  LAYOUT = "LAYOUT",
  FIRST_ONBOARDING = "FIRST_ONBOARDING",
  PRODUCER_SECOND_ONBOARDING = "PRODUCER_SECOND_ONBOARDING",
  PROFESSIONAL_SECOND_ONBOARDING = "PROFESSIONAL_SECOND_ONBOARDING",
  VERIFIED_FOREIGN_TRANSPORTER_COMPANY = "VERIFIED_FOREIGN_TRANSPORTER_COMPANY",
  PROFESSIONALS_SECOND_ONBOARDING = "PROFESSIONALS_SECOND_ONBOARDING",
  NON_PROFESSIONALS_SECOND_ONBOARDING = "NON_PROFESSIONALS_SECOND_ONBOARDING"
}
type templateInterface = {
  [key in TemplateNames]: number;
};

const templateIds: templateInterface = {
  [TemplateNames.LAYOUT]: parseInt(process.env.MAIN_TEMPLATE_ID, 10),
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
  [TemplateNames.VERIFIED_FOREIGN_TRANSPORTER_COMPANY]: parseInt(
    process.env.VERIFIED_FOREIGN_TRANSPORTER_COMPANY_TEMPLATE_ID,
    10
  ),
  [TemplateNames.PROFESSIONALS_SECOND_ONBOARDING]: parseInt(
    process.env.PROFESSIONALS_SECOND_ONBOARDING_TEMPLATE_ID,
    10
  ),
  [TemplateNames.NON_PROFESSIONALS_SECOND_ONBOARDING]: parseInt(
    process.env.NON_PROFESSIONALS_SECOND_ONBOARDING_TEMPLATE_ID,
    10
  )
};

export default templateIds;
