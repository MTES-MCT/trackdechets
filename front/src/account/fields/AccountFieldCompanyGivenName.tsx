import React from "react";
import { gql } from "@apollo/client";
import AccountField from "./AccountField";
import AccountFormSimpleInput from "./forms/AccountFormSimpleInput";
import {
  CompanyPrivate,
  MutationUpdateCompanyArgs,
  UserRole
} from "codegen-ui";
import AccountFieldNotEditable from "./AccountFieldNotEditable";

type Props = {
  company: CompanyPrivate;
};

AccountFieldCompanyGivenName.fragments = {
  company: gql`
    fragment AccountFieldCompanyGivenNameFragment on CompanyPrivate {
      id
      givenName
      userRole
    }
  `
};

const UPDATE_GIVEN_NAME = gql`
  mutation UpdateCompany($id: String!, $givenName: String) {
    updateCompany(id: $id, givenName: $givenName) {
      id
      givenName
      userRole
    }
  }
`;

export const tooltip =
  "Nom usuel de l'établissement qui permet de différencier plusieurs établissements ayant le même nom dans le sélecteur de Mon espace";

export default function AccountFieldCompanyGivenName({ company }: Props) {
  return company.userRole === UserRole.Admin ? (
    <AccountField
      name="givenName"
      label="Nom Usuel"
      value={company.givenName}
      tooltip={tooltip}
      renderForm={toggleEdition => (
        <AccountFormSimpleInput<Partial<MutationUpdateCompanyArgs>>
          name="givenName"
          type="text"
          value={company.givenName || ""}
          placeHolder="Nom usuel"
          mutation={UPDATE_GIVEN_NAME}
          mutationArgs={{ id: company.id }}
          toggleEdition={() => {
            toggleEdition();
          }}
        />
      )}
    />
  ) : (
    <AccountFieldNotEditable
      name="givenName"
      label="Nom Usuel"
      value={company.givenName}
    />
  );
}
