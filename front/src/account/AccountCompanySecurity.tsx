import React from "react";
import { gql } from "@apollo/client";
import AccountCompanySecurityCodeField from "./fields/AccountFieldCompanySecurityCode";
import AccountFieldCompanyDasriDirectTakeOver from "./fields/AccountFieldCompanyDasriDirectTakeOver";
import { CompanyPrivate } from "generated/graphql/types";

type Props = { company: CompanyPrivate };

AccountCompanySecurity.fragments = {
  company: gql`
    fragment AccountCompanySecurityFragment on CompanyPrivate {
      ...AccountFieldCompanySecurityCodeFragment
    }
    ${AccountCompanySecurityCodeField.fragments.company}
  `,
};

export default function AccountCompanySecurity({ company }: Props) {
  return (
    <>
      <AccountCompanySecurityCodeField company={company} />
      <AccountFieldCompanyDasriDirectTakeOver company={company} />
    </>
  );
}
