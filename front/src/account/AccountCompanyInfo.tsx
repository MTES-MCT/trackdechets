import React from "react";
import gql from "graphql-tag";
import { filter } from "graphql-anywhere";
import AccountFieldCompanyTypes from "./fields/AccountFieldCompanyTypes";
import AccountFieldNotEditable from "./fields/AccountFieldNotEditable";
import { Company } from "./AccountCompany";

type Props = { company: Company };

AccountCompanyInfo.fragments = {
  company: gql`
    fragment AccountCompanyInfoFragment on Company {
      siret
      address
      naf
      libelleNaf
      ...AccountFieldCompanyTypesFragment
      installation {
        codeS3ic
        urlFiche
      }
    }
    ${AccountFieldCompanyTypes.fragments.company}
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
            name="codeS3IC"
            label="Identifiant GEREP"
            value={company.installation.codeS3ic}
          />
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
      <AccountFieldCompanyTypes
        company={filter(AccountFieldCompanyTypes.fragments.company, company)}
      />
    </>
  );
}
