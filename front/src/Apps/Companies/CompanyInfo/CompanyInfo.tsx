import { CompanyPrivate } from "@td/codegen-ui";
import React from "react";
import CompanyIdentificationForm from "./CompanyIdentificationForm";
import CompanyProfileForm from "./CompanyProfileForm";
import "./companyInfo.scss";

interface CompanyInfoProps {
  company: CompanyPrivate;
}

const CompanyInfo = ({ company }: CompanyInfoProps) => {
  return (
    <div className="company-info">
      <CompanyIdentificationForm company={company} />
      <br />
      <hr />
      <CompanyProfileForm company={company} />
    </div>
  );
};
export default CompanyInfo;
