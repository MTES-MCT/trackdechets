import React from "react";
import gql from "graphql-tag";
import AccountField from "./AccountField";
import AccountFormCompanyTypes from "./forms/AccountFormCompanyTypes";
import { COMPANY_TYPES } from "../../login/CompanyType";
import { Company } from "../AccountCompany";

type Props = {
  company: Company;
};

AccountFieldCompanyTypes.fragments = {
  company: gql`
    fragment AccountFieldCompanyTypesFragment on CompanyPrivate {
      siret
      companyTypes
    }
  `
};

export default function AccountFieldCompanyTypes({ company }: Props) {
  const companyTypesLabel = company.companyTypes.map(ut => {
    const obj = COMPANY_TYPES.find(t => t.value === ut);
    return obj ? obj.label : "";
  });

  const v = (
    <ul>
      {companyTypesLabel.map((ct, idx) => {
        return <li key={idx}>{ct}</li>;
      })}
    </ul>
  );

  return (
    <AccountField
      name="companyTypes"
      label="Profil de l'entreprise"
      value={v}
      renderForm={toggleEdition => (
        <AccountFormCompanyTypes
          siret={company.siret}
          companyTypes={company.companyTypes}
          toggleEdition={toggleEdition}
        />
      )}
      modifier="Modifier"
    />
  );
}
