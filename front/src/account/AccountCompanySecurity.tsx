import React from "react";
import gql from "graphql-tag";
import AccountFieldNotEditable from "./fields/AccountFieldNotEditable";
import { Company } from "./AccountCompany";

type Props = { company: Company };

AccountCompanySecurity.fragments = {
  company: gql`
    fragment AccountCompanySecurityFragment on CompanyPrivate {
      securityCode
    }
  `
};

const tooltip =
  "Ce code de sécurité permet de valider un BSD au départ de vos déchets \
  si le transporteur est équipé d'un outil permettant la dématérialisation \
  du BSD. Ce numéro est unique et confidentiel";

export default function AccountCompanySecurity({ company }: Props) {
  return (
    <>
      <AccountFieldNotEditable
        name="code_securite"
        label="Code de sécurité"
        value={company.securityCode}
        tooltip={tooltip}
      />
    </>
  );
}
