import React from "react";
import AccountCompanySecurityCodeField from "../Account/fields/AccountFieldCompanySecurityCode";
import AccountFieldCompanyDasriDirectTakeOver from "../Account/fields/AccountFieldCompanyDasriDirectTakeOver";
import { CompanyPrivate } from "@td/codegen-ui";
import { AccountFieldCompanySignatureAutomation } from "../Account/fields/AccountFieldCompanySignatureAutomation";

type Props = { company: CompanyPrivate };

export default function AccountCompanySecurity({ company }: Props) {
  return (
    <>
      <AccountCompanySecurityCodeField company={company} />
      <AccountFieldCompanyDasriDirectTakeOver company={company} />
      <AccountFieldCompanySignatureAutomation company={company} />
    </>
  );
}
