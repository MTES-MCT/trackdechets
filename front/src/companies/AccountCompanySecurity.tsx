import React from "react";
import { gql } from "@apollo/client";
import AccountCompanySecurityCodeField from "../account/fields/AccountFieldCompanySecurityCode";
import AccountFieldCompanyDasriDirectTakeOver from "../account/fields/AccountFieldCompanyDasriDirectTakeOver";
import { CompanyPrivate } from "@td/codegen-ui";
import { AccountFieldCompanySignatureAutomation } from "../account/fields/AccountFieldCompanySignatureAutomation";

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
