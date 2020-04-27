import React from "react";
import gql from "graphql-tag";
import AccountCompanySecurityCodeField from "./fields/AccountFieldCompanySecurityCode";
import { Company } from "./AccountCompany";

type Props = { company: Company };

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
