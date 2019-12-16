import React from "react";
import gql from "graphql-tag";
import { Company } from "../AccountCompany";
import AccountField from "./AccountField";
import AccountFormCompanySecurityCode from "./forms/AccountFormCompanySecurityCode";

type Props = {
  company: Company;
};

AccountFielCompanySecurityCode.fragments = {
  company: gql`
    fragment AccountFielCompanySecurityCodeFragment on CompanyPrivate {
      id
      siret
      securityCode
    }
  `
};

const tooltip =
  "Ce code de sécurité permet de valider un BSD au départ de vos déchets \
  si le transporteur est équipé d'un outil permettant la dématérialisation \
  du BSD. Ce numéro est unique et confidentiel";

export default function AccountFielCompanySecurityCode({ company }: Props) {
  return (
    <AccountField
      name="securityCode"
      label="Code de sécurité"
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
  );
}
