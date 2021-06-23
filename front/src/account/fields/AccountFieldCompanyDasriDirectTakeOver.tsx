import React from "react";
import { gql } from "@apollo/client";
import AccountBooleanField from "./AccountBooleanField";

import {
  CompanyPrivate,
  UserRole,
  MutationUpdateCompanyArgs,
} from "generated/graphql/types";

import AccountFormCheckboxInput from "./forms/AccountFormCheckboxInput";

type Props = {
  company: CompanyPrivate;
};

AccountFieldCompanyDasriDirectTakeOver.fragments = {
  company: gql`
    fragment AccountFieldCompanySecurityCodeFragment on CompanyPrivate {
      id
      siret
      userRole
      allowBsdasriTakeOverWithoutSignature
    }
  `,
};
const UPDATE_DASRI_DIRECT_TAKEOVER = gql`
  mutation UpdateCompany(
    $siret: String!
    $allowBsdasriTakeOverWithoutSignature: Boolean!
  ) {
    updateCompany(
      siret: $siret
      allowBsdasriTakeOverWithoutSignature: $allowBsdasriTakeOverWithoutSignature
    ) {
      id
      siret
      allowBsdasriTakeOverWithoutSignature
    }
  }
`;
const fieldLabel = `En cochant cette case, j'atteste avoir signé une convention avec un collecteur pour mes DASRI et j'accepte que ce collecteur les prenne en charge sans ma signature (lors de la collecte) si je ne suis pas disponible.
Dans ce cas, je suis informé que je pourrais suivre les bordereaux sur Trackdéchets et disposer de leur archivage sur la plateforme`;
const fieldName = "allowBsdasriTakeOverWithoutSignature";
const fieldTitle = "Producteur dasri";

export default function AccountFieldCompanyDasriDirectTakeOver({
  company,
}: Props) {
  return (
    <>
      <AccountBooleanField
        name={fieldName}
        editable={company.userRole === UserRole.Admin}
        title={fieldTitle}
        value={company.allowBsdasriTakeOverWithoutSignature}
        renderForm={(toggleEdition, isEditing) => (
          <AccountFormCheckboxInput<Partial<MutationUpdateCompanyArgs>>
            name="allowBsdasriTakeOverWithoutSignature"
            label={fieldLabel}
            value={company.allowBsdasriTakeOverWithoutSignature}
            mutation={UPDATE_DASRI_DIRECT_TAKEOVER}
            mutationArgs={{ siret: company.siret }}
            isEditing={isEditing}
            toggleEdition={() => {
              toggleEdition();
            }}
          />
        )}
      />
    </>
  );
}
