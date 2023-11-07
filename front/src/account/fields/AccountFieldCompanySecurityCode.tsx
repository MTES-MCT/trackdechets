import React from "react";
import { gql } from "@apollo/client";
import AccountField from "./AccountField";
import AccountFieldNotEditable from "./AccountFieldNotEditable";
import AccountFormCompanySecurityCode from "./forms/AccountFormCompanySecurityCode";
import { CompanyPrivate, UserRole } from "codegen-ui";

type Props = {
  company: CompanyPrivate;
};

AccountFieldCompanySecurityCode.fragments = {
  company: gql`
    fragment AccountFieldCompanySecurityCodeFragment on CompanyPrivate {
      id
      orgId
      userRole
      securityCode
      allowBsdasriTakeOverWithoutSignature
    }
  `
};

const tooltip =
  "Ce code sécurisé de signature vous permet de signer un BSD au départ de vos déchets sur l'outil (smartphone/tablette) du transporteur. Ce numéro est unique et confidentiel.";

const fieldName = "securityCode";
const fieldLabel = "Code de signature";

export default function AccountFieldCompanySecurityCode({ company }: Props) {
  return company.userRole === UserRole.Admin ? (
    <AccountField
      name={fieldName}
      label={fieldLabel}
      value={company.securityCode}
      renderForm={toggleEdition => (
        <AccountFormCompanySecurityCode
          toggleEdition={toggleEdition}
          mutationArgs={{ siret: company.orgId }}
        />
      )}
      tooltip={tooltip}
      modifier="Renouveler"
    />
  ) : (
    <AccountFieldNotEditable
      name={fieldName}
      label={fieldLabel}
      value={company.securityCode}
      tooltip={tooltip}
    />
  );
}
