import React from "react";
import { gql } from "@apollo/client";
import { filter } from "graphql-anywhere";
import AccountFieldCompanyContact from "./fields/AccountFieldCompanyContact";
import AccountFieldCompanyContactEmail from "./fields/AccountFieldCompanyContactEmail";
import AccountFieldCompanyContactPhone from "./fields/AccountFieldCompanyContactPhone";
import AccountFieldCompanyWebsite from "./fields/AccountFieldCompanyWebsite";
import AccountFieldCompanyAgreements from "./fields/AccountFieldCompanyAgreements";
import { CompanyPrivate, CompanyType } from "../generated/graphql/types";
import { generatePath } from "react-router-dom";
import routes from "Apps/routes";

type Props = {
  company: CompanyPrivate;
};

AccountCompanyContact.fragments = {
  company: gql`
    fragment AccountCompanyContactFragment on CompanyPrivate {
      orgId
      siret
      vatNumber
      companyTypes
      ...AccountFieldCompanyContactFragment
      ...AccountFieldCompanyContactEmailFragment
      ...AccountFieldCompanyContactPhoneFragment
      ...AccountFieldCompanyWebsiteFragment
      ...AccountFieldCompanyAgreementsFragment
    }
    ${AccountFieldCompanyContact.fragments.company}
    ${AccountFieldCompanyContactEmail.fragments.company}
    ${AccountFieldCompanyContactPhone.fragments.company}
    ${AccountFieldCompanyWebsite.fragments.company}
    ${AccountFieldCompanyAgreements.fragments.company}
  `,
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
      <AccountFieldCompanyContact
        company={filter(AccountFieldCompanyContact.fragments.company, company)}
      />
      <AccountFieldCompanyContactEmail
        company={filter(
          AccountFieldCompanyContactEmail.fragments.company,
          company
        )}
      />
      <AccountFieldCompanyContactPhone
        company={filter(
          AccountFieldCompanyContactPhone.fragments.company,
          company
        )}
      />
      <AccountFieldCompanyWebsite
        company={filter(AccountFieldCompanyWebsite.fragments.company, company)}
      />
      {company.companyTypes.includes(CompanyType.EcoOrganisme) && (
        <AccountFieldCompanyAgreements company={company} />
      )}
    </>
  );
}
