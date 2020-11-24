import React from "react";
import { gql } from "@apollo/client";
import AccountField from "./AccountField";
import AccountFormSimpleInput from "./forms/AccountFormSimpleInput";
import {
  CompanyPrivate,
  MutationUpdateCompanyArgs,
} from "generated/graphql/types";

type Props = {
  company: CompanyPrivate;
};

AccountFielCompanyGerepId.fragments = {
  company: gql`
    fragment AccountFieldCompanyGerepIdFragment on CompanyPrivate {
      siret
      gerepId
    }
  `,
};

const UPDATE_GEREP_ID = gql`
  mutation UpdateCompany($siret: String!, $gerepId: String) {
    updateCompany(siret: $siret, gerepId: $gerepId) {
      id
      siret
      gerepId
    }
  }
`;

export default function AccountFielCompanyGerepId({ company }: Props) {
  return (
    <AccountField
      name="gerepId"
      label="Identifiant GEREP"
      value={company.gerepId}
      renderForm={toggleEdition => (
        <AccountFormSimpleInput<Partial<MutationUpdateCompanyArgs>>
          name="gerepId"
          type="text"
          value={company.gerepId}
          placeHolder="Identifiant GEREP"
          mutation={UPDATE_GEREP_ID}
          mutationArgs={{ siret: company.siret }}
          toggleEdition={() => {
            toggleEdition();
          }}
        />
      )}
    />
  );
}
