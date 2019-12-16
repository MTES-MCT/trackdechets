import React from "react";
import gql from "graphql-tag";
import AccountField from "./AccountField";
import AccountFieldNotEditable from "./AccountFieldNotEditable";
import AccountFormSimpleInput from "./forms/AccountFormSimpleInput";
import { Company, UserRole } from "../AccountCompany";

type Props = {
  company: Company;
};

AccountFielCompanyContactPhone.fragments = {
  company: gql`
    fragment AccountFieldCompanyContactPhoneFragment on CompanyPrivate {
      id
      siret
      contactPhone
      userRole
    }
  `
};

const UPDATE_CONTACT_PHONE = gql`
  mutation UpdateCompany($siret: String!, $contactPhone: String) {
    updateCompany(siret: $siret, contactPhone: $contactPhone) {
      id
      siret
      contactPhone
    }
  }
`;

export default function AccountFielCompanyContactPhone({ company }: Props) {
  const fieldName = "contactPhone";
  const fieldLabel = "Téléphone de contact";

  return (
    <>
      {company.userRole == UserRole.ADMIN ? (
        <AccountField
          name={fieldName}
          label={fieldLabel}
          value={company.contactPhone}
          renderForm={toggleEdition => (
            <AccountFormSimpleInput<{ contactPhone: string }>
              name="contactPhone"
              type="tel"
              value={company.contactPhone}
              placeHolder={fieldLabel}
              mutation={UPDATE_CONTACT_PHONE}
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
          value={company.contactPhone}
        />
      )}
    </>
  );
}
