import React from "react";
import { gql } from "@apollo/client";
import AccountCompanySecurityCodeField from "./fields/AccountFieldCompanySecurityCode";
import AccountFieldCompanyDasriDirectTakeOver from "./fields/AccountFieldCompanyDasriDirectTakeOver";
import { CompanyPrivate } from "codegen-ui";
import { AccountFieldCompanySignatureAutomation } from "./fields/AccountFieldCompanySignatureAutomation";

type Props = { company: CompanyPrivate };

AccountCompanySecurity.fragments = {
  company: gql`
    fragment AccountCompanySecurityFragment on CompanyPrivate {
      ...AccountFieldCompanySecurityCodeFragment
      ...AccountFieldCompanySignatureAutomationFragment
    }
    ${AccountCompanySecurityCodeField.fragments.company}
    ${AccountFieldCompanySignatureAutomation.fragments.company}
  `
};

export default function AccountCompanySecurity({ company }: Props) {
  return (
    <>
      <AccountCompanySecurityCodeField company={company} />
      <AccountFieldCompanyDasriDirectTakeOver company={company} />
      <AccountFieldCompanySignatureAutomation company={company} />
    </>
  );
}
