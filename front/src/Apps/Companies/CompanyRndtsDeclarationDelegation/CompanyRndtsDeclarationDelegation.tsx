import React from "react";
import "./companyRndtsDeclarationDelegation.scss";
import { CompanyPrivate } from "@td/codegen-ui";
import { CompanyRndtsDeclarationDelegationAsDelegator } from "./CompanyRndtsDeclarationDelegationAsDelegator";
import { CompanyRndtsDeclarationDelegationAsDelegate } from "./CompanyRndtsDeclarationDelegationAsDelegate";

interface Props {
  company: CompanyPrivate;
}

export const CompanyRndtsDeclarationDelegation = ({ company }: Props) => {
  return (
    <>
      <CompanyRndtsDeclarationDelegationAsDelegator company={company} />
      <CompanyRndtsDeclarationDelegationAsDelegate company={company} />
    </>
  );
};
