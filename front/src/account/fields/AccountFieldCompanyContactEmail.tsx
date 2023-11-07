import React from "react";
import { gql } from "@apollo/client";
import AccountField from "./AccountField";
import AccountFieldNotEditable from "./AccountFieldNotEditable";
import AccountFormSimpleInput from "./forms/AccountFormSimpleInput";
import { object, string } from "yup";
import {
  CompanyPrivate,
  UserRole,
  MutationUpdateCompanyArgs
} from "codegen-ui";

type Props = {
  company: CompanyPrivate;
};

AccountFieldCompanyContactEmail.fragments = {
  company: gql`
    fragment AccountFieldCompanyContactEmailFragment on CompanyPrivate {
      id
      contactEmail
      userRole
    }
  `
};

const UPDATE_CONTACT_EMAIL = gql`
  mutation UpdateCompany($id: String!, $contactEmail: String) {
    updateCompany(id: $id, contactEmail: $contactEmail) {
      id
      contactEmail
      userRole
    }
  }
`;

const yupSchema = object().shape({
  contactEmail: string().email()
});

export default function AccountFieldCompanyContactEmail({ company }: Props) {
  const fieldName = "contactEmail";
  const fieldLabel = "Email de contact";

  return company.userRole === UserRole.Admin ? (
    <AccountField
      name={fieldName}
      label={fieldLabel}
      value={company.contactEmail}
      renderForm={toggleEdition => (
        <AccountFormSimpleInput<Partial<MutationUpdateCompanyArgs>>
          name="contactEmail"
          type="email"
          value={company.contactEmail}
          placeHolder={fieldLabel}
          mutation={UPDATE_CONTACT_EMAIL}
          mutationArgs={{ id: company.id }}
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
      value={company.contactEmail}
    />
  );
}
