import React from "react";
import { CompanyPrivate } from "@td/codegen-ui";
import CompanySignatureCode from "./CompanySignatureCode";
import CompanySignatureDasriDirectTakeOver from "./CompanySignatureDasriDirectTakeOver";
import CompanySignatureAutomation from "./CompanySignatureAutomation";

import "./companySignature.scss";

interface CompanySignatureProps {
  company: CompanyPrivate;
}
const CompanySignature = ({ company }: CompanySignatureProps) => {
  return (
    <div className="company-signature">
      <CompanySignatureCode company={company} />
      <CompanySignatureDasriDirectTakeOver company={company} />
      <CompanySignatureAutomation company={company} />
    </div>
  );
};

export default CompanySignature;
