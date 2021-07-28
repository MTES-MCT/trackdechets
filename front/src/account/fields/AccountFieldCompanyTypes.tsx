import React from "react";
import { gql } from "@apollo/client";
import AccountField from "./AccountField";
import AccountFormCompanyTypes from "./forms/AccountFormCompanyTypes";
import { COMPANY_TYPES } from "../../login/CompanyType";
import { CompanyPrivate, UserRole } from "generated/graphql/types";
import AccountFieldNotEditable from "./AccountFieldNotEditable";

type Props = {
  company: CompanyPrivate;
};

AccountFieldCompanyTypes.fragments = {
  company: gql`
    fragment AccountFieldCompanyTypesFragment on CompanyPrivate {
      siret
      companyTypes
    }
  `,
};

export default function AccountFieldCompanyTypes({ company }: Props) {
  const companyTypes = company.companyTypes || [];

  const companyTypesLabel = companyTypes.map(ut => {
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
    <>
      {company.userRole === UserRole.Admin ? (
        <AccountField
          name="companyTypes"
          label="Profil de l'entreprise"
          value={v}
          renderForm={toggleEdition => (
            <AccountFormCompanyTypes
              name="companyTypes"
              siret={company.siret}
              companyTypes={companyTypes}
              toggleEdition={toggleEdition}
            />
          )}
        />
      ) : (
        <AccountFieldNotEditable
          name="companyTypes"
          label="Profil de l'entreprise"
          value={v}
        />
      )}
    </>
  );
}
