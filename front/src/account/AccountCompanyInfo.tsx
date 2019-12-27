import React from "react";
import gql from "graphql-tag";
import { filter } from "graphql-anywhere";
import AccountFieldCompanyTypes from "./fields/AccountFieldCompanyTypes";
import AccountFieldNotEditable from "./fields/AccountFieldNotEditable";
import AccountFieldCompanyGerepId from "./fields/AccountFieldCompanyGerepId";
import { Company } from "./AccountCompany";

type Props = { company: Company };

AccountCompanyInfo.fragments = {
  company: gql`
    fragment AccountCompanyInfoFragment on CompanyPrivate {
      siret
      address
      naf
      libelleNaf
      ...AccountFieldCompanyTypesFragment
      ...AccountFieldCompanyGerepIdFragment
      installation {
        urlFiche
      }
    }
    ${AccountFieldCompanyTypes.fragments.company}
    ${AccountFieldCompanyGerepId.fragments.company}
  `
};

export default function AccountCompanyInfo({ company }: Props) {
  return (
    <>
      <AccountFieldNotEditable
        name="siret"
        label="Numéro SIRET"
        value={company.siret}
      />
      <AccountFieldNotEditable
        name="naf"
        label="Code NAF"
        value={`${company.naf} - ${company.libelleNaf}`}
      />
      <AccountFieldNotEditable
        name="adresse"
        label="Adresse"
        value={company.address}
      />
      {company.installation && (
        <>
          <AccountFieldNotEditable
            name="fiche_ic"
            label="Fiche ICPE"
            value={
              <a href={company.installation.urlFiche} target="_blank">
                Lien
              </a>
            }
          />
        </>
      )}
      <AccountFieldCompanyGerepId company={company} />
      <AccountFieldCompanyTypes
        company={filter(AccountFieldCompanyTypes.fragments.company, company)}
      />
    </>
  );
}
