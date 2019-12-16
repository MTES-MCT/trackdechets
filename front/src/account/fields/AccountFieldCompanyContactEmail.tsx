import React from "react";
import gql from "graphql-tag";
import AccountField from "./AccountField";
import AccountFieldNotEditable from "./AccountFieldNotEditable";
import AccountFormSimpleInput from "./forms/AccountFormSimpleInput";
import { Company, UserRole } from "../AccountCompany";

type Props = {
  company: Company;
};

AccountFielCompanyContactEmail.fragments = {
  company: gql`
    fragment AccountFieldCompanyContactEmailFragment on CompanyPrivate {
      id
      siret
      contactEmail
      userRole
    }
  `
};

const UPDATE_CONTACT_EMAIL = gql`
  mutation UpdateCompany($siret: String!, $contactEmail: String) {
    updateCompany(siret: $siret, contactEmail: $contactEmail) {
      id
      siret
      contactEmail
    }
  }
`;

export default function AccountFielCompanyContactEmail({ company }: Props) {
  const fieldName = "contactEmail";
  const fieldLabel = "Email de contact";

  return (
    <>
      {company.userRole == UserRole.ADMIN ? (
        <AccountField
          name={fieldName}
          label={fieldLabel}
          value={company.contactEmail}
          renderForm={toggleEdition => (
            <AccountFormSimpleInput<{ contactEmail: string }>
              name="contactEmail"
              type="email"
              value={company.contactEmail}
              placeHolder={fieldLabel}
              mutation={UPDATE_CONTACT_EMAIL}
              mutationArgs={{ siret: company.siret }}
              toggleEdition={() => {
                toggleEdition();
              }}
            />
          )}
        />
      ) : (
        <AccountFieldNotEditable
          name={fieldName}
          label={fieldLabel}
          value={company.contactEmail}
        />
      )}
    </>
  );
}
