import React from "react";
import { gql } from "@apollo/client";
import { filter } from "graphql-anywhere";
import AccountFieldCompanyContactEmail from "./fields/AccountFieldCompanyContactEmail";
import AccountFieldCompanyContactPhone from "./fields/AccountFieldCompanyContactPhone";
import AccountFieldCompanyWebsite from "./fields/AccountFieldCompanyWebsite";
import AccountFieldCompanyAgreements from "./fields/AccountFieldCompanyAgreements";
import { CompanyPrivate, CompanyType } from "../generated/graphql/types";
import { generatePath } from "react-router-dom";
import routes from "common/routes";

type Props = {
  company: CompanyPrivate;
};

AccountCompanyPage.fragments = {
  company: gql`
    fragment AccountCompanyPageFragment on CompanyPrivate {
      siret
      companyTypes
      ...AccountFieldCompanyContactEmailFragment
      ...AccountFieldCompanyContactPhoneFragment
      ...AccountFieldCompanyWebsiteFragment
      ...AccountFieldCompanyAgreementsFragment
    }
    ${AccountFieldCompanyContactEmail.fragments.company}
    ${AccountFieldCompanyContactPhone.fragments.company}
    ${AccountFieldCompanyWebsite.fragments.company}
    ${AccountFieldCompanyAgreements.fragments.company}
  `,
};

export default function AccountCompanyPage({ company }: Props) {
  const companyPage =
    `${process.env.REACT_APP_URL_SCHEME}://` +
    `${process.env.REACT_APP_HOSTNAME}` +
    generatePath(routes.company, { siret: company.siret });

  return (
    <>
      <div className="notification">
        Ces informations de contact sont destinées à apparaitre sur votre{" "}
        <a href={companyPage} target="_blank" rel="noopener noreferrer">
          fiche entreprise
        </a>{" "}
        et sont consultables par n'importe qui.
      </div>
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
