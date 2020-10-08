import React from "react";
import gql from "graphql-tag";
import AccountCompanySecurityCodeField from "./fields/AccountFieldCompanySecurityCode";
import { CompanyPrivate } from "generated/graphql/types";

type Props = { company: CompanyPrivate };

AccountCompanySecurity.fragments = {
  company: gql`
    fragment AccountCompanySecurityFragment on CompanyPrivate {
      ...AccountFielCompanySecurityCodeFragment
    }
    ${AccountCompanySecurityCodeField.fragments.company}
  `,
};

export default function AccountCompanySecurity({ company }: Props) {
  return <AccountCompanySecurityCodeField company={company} />;
}
