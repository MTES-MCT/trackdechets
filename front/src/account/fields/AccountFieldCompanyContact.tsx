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

type Props = {
  company: CompanyPrivate;
};

AccountFielCompanyContact.fragments = {
  company: gql`
    fragment AccountFieldCompanyContactFragment on CompanyPrivate {
      id
      siret
      contact
      userRole
    }
  `,
};

const UPDATE_CONTACT = gql`
  mutation UpdateCompany($siret: String!, $contact: String!) {
    updateCompany(siret: $siret, contact: $contact) {
      id
      siret
      contact
    }
  }
`;

const yupSchema = object().shape({
  contact: string().max(100),
});

export default function AccountFielCompanyContact({ company }: Props) {
  const fieldName = "contact";
  const fieldLabel = "Prénom et nom du contact";

  return (
    <>
      {company.userRole === UserRole.Admin ? (
        <AccountField
          name={fieldName}
          label={fieldLabel}
          value={company.contact}
          renderForm={toggleEdition => (
            <AccountFormSimpleInput<Partial<MutationUpdateCompanyArgs>>
              name="contact"
              type="text"
              value={company.contact}
              placeHolder={fieldLabel}
              mutation={UPDATE_CONTACT}
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
          value={company.contact}
        />
      )}
    </>
  );
}
