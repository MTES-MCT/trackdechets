import React from "react";
import "./companyRegistryDelegation.scss";
import { CompanyPrivate } from "@td/codegen-ui";
import { CompanyRegistryDelegationAsDelegator } from "./CompanyRegistryDelegationAsDelegator";
import { CompanyRegistryDelegationAsDelegate } from "./CompanyRegistryDelegationAsDelegate";

interface Props {
  company: CompanyPrivate;
}

export const CompanyRegistryDelegation = ({ company }: Props) => {
  return (
    <>
      <CompanyRegistryDelegationAsDelegator company={company} />
      <CompanyRegistryDelegationAsDelegate company={company} />
    </>
  );
};
