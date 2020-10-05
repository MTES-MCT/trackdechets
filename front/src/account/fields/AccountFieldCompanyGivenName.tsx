import React from "react";
import gql from "graphql-tag";
import AccountField from "./AccountField";
import AccountFormSimpleInput from "./forms/AccountFormSimpleInput";
import {
  CompanyPrivate,
  MutationUpdateCompanyArgs,
} from "src/generated/graphql/types";

type Props = {
  company: CompanyPrivate;
};

AccountFielCompanyGivenName.fragments = {
  company: gql`
    fragment AccountFieldCompanyGivenNameFragment on CompanyPrivate {
      siret
      givenName
    }
  `,
};

const UPDATE_GIVEN_NAME = gql`
  mutation UpdateCompany($siret: String!, $givenName: String) {
    updateCompany(siret: $siret, givenName: $givenName) {
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
    <AccountField
      name="givenName"
      label="Nom Usuel"
      value={company.givenName}
      tooltip={tooltip}
      renderForm={toggleEdition => (
        <AccountFormSimpleInput<Partial<MutationUpdateCompanyArgs>>
          name="givenName"
          type="text"
          value={company.givenName}
          placeHolder="Nom usuel"
          mutation={UPDATE_GIVEN_NAME}
          mutationArgs={{ siret: company.siret }}
          toggleEdition={() => {
            toggleEdition();
          }}
        />
      )}
    />
  );
}
