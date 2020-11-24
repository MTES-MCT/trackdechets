import React from "react";
import { gql } from "@apollo/client";
import AccountField from "./AccountField";
import AccountFieldNotEditable from "./AccountFieldNotEditable";
import AccountFormCompanySecurityCode from "./forms/AccountFormCompanySecurityCode";
import { CompanyPrivate, UserRole } from "generated/graphql/types";

type Props = {
  company: CompanyPrivate;
};

AccountFielCompanySecurityCode.fragments = {
  company: gql`
    fragment AccountFielCompanySecurityCodeFragment on CompanyPrivate {
      id
      siret
      userRole
      securityCode
    }
  `,
};

const tooltip =
  "Ce code de sécurité permet de valider un BSD au départ de vos déchets si le transporteur est équipé d'un outil permettant la dématérialisation du BSD. Ce numéro est unique et confidentiel";

const fieldName = "securityCode";
const fieldLabel = "Code de sécurité";

export default function AccountFielCompanySecurityCode({ company }: Props) {
  return (
    <>
      {company.userRole === UserRole.Admin ? (
        <AccountField
          name={fieldName}
          label={fieldLabel}
          value={company.securityCode}
          renderForm={toggleEdition => (
            <AccountFormCompanySecurityCode
              toggleEdition={toggleEdition}
              mutationArgs={{ siret: company.siret }}
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
      )}
    </>
  );
}
