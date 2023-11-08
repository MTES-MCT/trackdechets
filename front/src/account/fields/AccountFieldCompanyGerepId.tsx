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

AccountFieldCompanyGerepId.fragments = {
  company: gql`
    fragment AccountFieldCompanyGerepIdFragment on CompanyPrivate {
      id
      gerepId
      userRole
    }
  `
};

const UPDATE_GEREP_ID = gql`
  mutation UpdateCompany($id: String!, $gerepId: String) {
    updateCompany(id: $id, gerepId: $gerepId) {
      id
      gerepId
      userRole
    }
  }
`;

export default function AccountFieldCompanyGerepId({ company }: Props) {
  return company.userRole === UserRole.Admin ? (
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
          mutationArgs={{ id: company.id }}
          toggleEdition={() => {
            toggleEdition();
          }}
        />
      )}
    />
  ) : (
    <AccountFieldNotEditable
      name="gerepId"
      label="Identifiant GEREP"
      value={company.gerepId}
    />
  );
}
