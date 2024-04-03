import React from "react";
import AccountFieldCompanyContact from "../Account/fields/AccountFieldCompanyContact";
import AccountFieldCompanyContactEmail from "../Account/fields/AccountFieldCompanyContactEmail";
import AccountFieldCompanyContactPhone from "../Account/fields/AccountFieldCompanyContactPhone";
import AccountFieldCompanyWebsite from "../Account/fields/AccountFieldCompanyWebsite";
import AccountFieldCompanyAgreements from "../Account/fields/AccountFieldCompanyAgreements";
import { CompanyPrivate, CompanyType } from "@td/codegen-ui";
import { generatePath } from "react-router-dom";
import routes from "../routes";

type Props = {
  company: CompanyPrivate;
};

export default function AccountCompanyContact({ company }: Props) {
  const companyPage =
    `${import.meta.env.VITE_URL_SCHEME}://` +
    `${import.meta.env.VITE_HOSTNAME}` +
    generatePath(routes.company, { orgId: company.orgId });

  return (
    <>
      <div className="notification">
        Ces informations de contact sont destinées à apparaitre sur votre{" "}
        <a href={companyPage} target="_blank" rel="noopener noreferrer">
          fiche entreprise
        </a>{" "}
        et sont consultables par n'importe qui. Elles sont également utilisées
        pour compléter automatiquement les informations de contact sur les
        bordereaux lorsque votre n°SIRET est visé.
      </div>
      <AccountFieldCompanyContact company={company} />
      <AccountFieldCompanyContactEmail company={company} />
      <AccountFieldCompanyContactPhone company={company} />
      <AccountFieldCompanyWebsite company={company} />
      {company.companyTypes.includes(CompanyType.EcoOrganisme) && (
        <AccountFieldCompanyAgreements company={company} />
      )}
    </>
  );
}
