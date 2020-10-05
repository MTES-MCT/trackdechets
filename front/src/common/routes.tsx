import { CompanyType, CompanyPrivate } from "src/generated/graphql/types";

export const dashboardBase = "/dashboard";

export default function getDashboardRoutes({
  siret,
  company,
}: {
  siret: string;
  company?: CompanyPrivate | undefined;
}) {
  const dashboardRoot = `${dashboardBase}/${siret}`;
  const baseRoutes = {
    dashboard: dashboardRoot,
    draft: `${dashboardRoot}/slips/drafts`,
    forAction: `${dashboardRoot}/slips/act`,
    followUp: `${dashboardRoot}/slips/follow`,
    archive: `${dashboardRoot}/slips/history`,
    exports: `${dashboardRoot}/exports`,
    stats: `${dashboardRoot}/stats`,
  };

  const transportRoutes = {
    transportToCollect: `${dashboardRoot}/transport/to-collect`,
    transportCollected: `${dashboardRoot}/transport/collected`,
  };

  return {
    ...baseRoutes,
    ...(company?.companyTypes.includes(CompanyType.Transporter)
      ? transportRoutes
      : {}),
  };
}
export const accountBase = "/account";
export const accountRoutes = {
  accountInfo: `${accountBase}/info`,
  accountCompanies: `${accountBase}/companies`,
  accountApi: `${accountBase}/api`,
};
