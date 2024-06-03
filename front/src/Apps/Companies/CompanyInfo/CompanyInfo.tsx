import { CompanyPrivate } from "@td/codegen-ui";
import React from "react";
import CompanyIdentificationForm from "./CompanyIdentificationForm";
import CompanyProfileForm from "./CompanyProfileForm";
import AccountFieldCompanyVerificationStatus from "../../Account/fields/AccountFieldCompanyVerificationStatus";
import { PROFESSIONALS } from "@td/constants";

import "./companyInfo.scss";

const { VITE_VERIFY_COMPANY } = import.meta.env;

interface CompanyInfoProps {
  company: CompanyPrivate;
}

const CompanyInfo = ({ company }: CompanyInfoProps) => {
  const isWasteProfessional = company.companyTypes.some(ct =>
    PROFESSIONALS.includes(ct)
  );

  return (
    <div className="company-info">
      <CompanyIdentificationForm company={company} />
      <br />
      <hr />
      <CompanyProfileForm company={company} />
      {isWasteProfessional && VITE_VERIFY_COMPANY === "true" && (
        <AccountFieldCompanyVerificationStatus company={company} />
      )}
    </div>
  );
};
export default CompanyInfo;
