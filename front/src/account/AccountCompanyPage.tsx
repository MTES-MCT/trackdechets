import React from "react";
import gql from "graphql-tag";
import { filter } from "graphql-anywhere";
import { Company } from "./AccountCompany";
import AccountFieldCompanyContactEmail from "./fields/AccountFieldCompanyContactEmail";
import AccountFieldCompanyContactPhone from "./fields/AccountFieldCompanyContactPhone";
import AccountFieldCompanyWebsite from "./fields/AccountFieldCompanyWebsite";

type Props = {
  company: Company;
};

AccountCompanyPage.fragments = {
  company: gql`
    fragment AccountCompanyPageFragment on CompanyPrivate {
      siret
      ...AccountFieldCompanyContactEmailFragment
      ...AccountFieldCompanyContactPhoneFragment
      ...AccountFieldCompanyWebsiteFragment
    }
    ${AccountFieldCompanyContactEmail.fragments.company}
    ${AccountFieldCompanyContactPhone.fragments.company}
    ${AccountFieldCompanyWebsite.fragments.company}
  `
};

export default function AccountCompanyPage({ company }: Props) {
  const companyPage =
    `${process.env.REACT_APP_URL_SCHEME}://` +
    `${process.env.REACT_APP_HOSTNAME}` +
    `/company/${company.siret}`;

  return (
    <>
      <div className="notification">
        Ces éléments sont destinés à apparaitre sur votre{" "}
        <a href={companyPage} target="_blank">
          fiche entreprise
        </a>{" "}
        consultable par les autres utilisateurs de Trackdéchets.
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
    </>
  );
}
