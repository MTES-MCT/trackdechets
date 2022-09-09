import React from "react";
import { gql } from "@apollo/client";
import AccountField from "./AccountField";
import AccountFormSimpleInput from "./forms/AccountFormSimpleInput";
import {
  CompanyPrivate,
  MutationUpdateCompanyArgs,
  UserRole,
} from "generated/graphql/types";
import AccountFieldNotEditable from "./AccountFieldNotEditable";

type Props = {
  company: CompanyPrivate;
};

AccountFielCompanyGivenName.fragments = {
  company: gql`
    fragment AccountFieldCompanyGivenNameFragment on CompanyPrivate {
      siret
      givenName
      userRole
    }
  `,
};

const UPDATE_GIVEN_NAME = gql`
  mutation UpdateCompany($id: String!, $givenName: String) {
    updateCompany(id: $id, givenName: $givenName) {
      id
      siret
      givenName
    }
  }
`;

export const tooltip =
  "Nom usuel de l'établissement qui permet de différencier plusieurs établissements ayant le même nom dans le sélecteur de Mon espace";

export default function AccountFielCompanyGivenName({ company }: Props) {
  return (
    <>
      {company.userRole === UserRole.Admin ? (
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
      )}
    </>
  );
}
