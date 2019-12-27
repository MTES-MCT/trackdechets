import React from "react";
import gql from "graphql-tag";
import AccountField from "./AccountField";
import AccountFieldNotEditable from "./AccountFieldNotEditable";
import AccountFormSimpleInput from "./forms/AccountFormSimpleInput";
import { Company, UserRole } from "../AccountCompany";
import { object, string } from "yup";

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

const yupSchema = object().shape({
  contactPhone: string()
    .trim()
    .matches(/^(0[1-7])(?:[ _.-]?(\d{2})){4}$/, {
      message: "Le numéro de téléphone est invalide",
      excludeEmptyString: true
    })
});

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
              yupSchema={yupSchema}
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
