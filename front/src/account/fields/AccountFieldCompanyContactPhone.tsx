import React from "react";
import { gql } from "@apollo/client";
import AccountField from "./AccountField";
import AccountFieldNotEditable from "./AccountFieldNotEditable";
import AccountFormSimpleInput from "./forms/AccountFormSimpleInput";
import { object, string } from "yup";
import {
  CompanyPrivate,
  UserRole,
  MutationUpdateCompanyArgs,
} from "generated/graphql/types";
import { validatePhoneNumber } from "common/helper";

type Props = {
  company: CompanyPrivate;
};

AccountFielCompanyContactPhone.fragments = {
  company: gql`
    fragment AccountFieldCompanyContactPhoneFragment on CompanyPrivate {
      id
      siret
      contactPhone
      userRole
    }
  `,
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
    .test(
      "is-valid-phone",
      "Merci de renseigner un numéro de téléphone valide",
      validatePhoneNumber
    ),
});

export default function AccountFielCompanyContactPhone({ company }: Props) {
  const fieldName = "contactPhone";
  const fieldLabel = "Téléphone de contact";

  return (
    <>
      {company.userRole === UserRole.Admin ? (
        <AccountField
          name={fieldName}
          label={fieldLabel}
          value={company.contactPhone}
          renderForm={toggleEdition => (
            <AccountFormSimpleInput<Partial<MutationUpdateCompanyArgs>>
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
