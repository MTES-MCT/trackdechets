import React from "react";
import { gql } from "@apollo/client";
import AccountBooleanField from "./AccountBooleanField";
import styles from "./AccountField.module.scss";

import {
  CompanyPrivate,
  UserRole,
  MutationUpdateCompanyArgs
} from "codegen-ui";

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
  `
};
const UPDATE_DASRI_DIRECT_TAKEOVER = gql`
  mutation UpdateCompany(
    $id: String!
    $allowBsdasriTakeOverWithoutSignature: Boolean!
  ) {
    updateCompany(
      id: $id
      allowBsdasriTakeOverWithoutSignature: $allowBsdasriTakeOverWithoutSignature
    ) {
      id
      siret
      allowBsdasriTakeOverWithoutSignature
    }
  }
`;
const fieldLabel = `J'autorise l'emport direct de DASRI`;
const fieldName = "allowBsdasriTakeOverWithoutSignature";

const fieldTitle = "Emport direct de DASRI autorisé";
const explanation = `En cochant cette case, j'atteste avoir signé une convention avec un collecteur pour mes DASRI et j'accepte que ce collecteur les prenne en charge sans ma signature (lors de la collecte) si je ne suis pas disponible.
Dans ce cas, je suis informé que je pourrais suivre les bordereaux sur Trackdéchets et disposer de leur archivage sur la plateforme`;

export default function AccountFieldCompanyDasriDirectTakeOver({
  company
}: Props) {
  return (
    <AccountBooleanField
      name={fieldName}
      editable={company.userRole === UserRole.Admin}
      title={fieldTitle}
      tooltip={explanation}
      value={company.allowBsdasriTakeOverWithoutSignature}
      renderForm={(toggleEdition, isEditing) =>
        isEditing ? (
          <AccountFormCheckboxInput<Partial<MutationUpdateCompanyArgs>>
            name="allowBsdasriTakeOverWithoutSignature"
            label={`${fieldLabel} - ${explanation}`}
            value={company.allowBsdasriTakeOverWithoutSignature}
            mutation={UPDATE_DASRI_DIRECT_TAKEOVER}
            mutationArgs={{ id: company.id }}
            isEditing={isEditing}
            toggleEdition={() => {
              toggleEdition();
            }}
          />
        ) : (
          <span className={styles.field__value}>
            {company.allowBsdasriTakeOverWithoutSignature ? "Oui" : "Non"}
          </span>
        )
      }
    />
  );
}
