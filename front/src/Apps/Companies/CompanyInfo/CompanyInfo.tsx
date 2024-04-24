import { CompanyPrivate } from "@td/codegen-ui";
import React from "react";
import CompanyIdentificationForm from "./CompanyIdentificationForm";
import CompanyProfileForm from "./CompanyProfileForm";

interface CompanyInfoProps {
  company: CompanyPrivate;
}

const CompanyInfo = ({ company }: CompanyInfoProps) => {
  return (
    <>
      <CompanyIdentificationForm company={company} />
      <br />
      <hr />
      <CompanyProfileForm company={company} />
    </>
  );
};
export default CompanyInfo;
