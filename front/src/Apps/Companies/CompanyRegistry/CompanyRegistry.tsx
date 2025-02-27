import React from "react";
import "./CompanyRegistry.scss";
import { CompanyPrivate } from "@td/codegen-ui";
import { CompanyRegistryDelegationAsDelegator } from "./CompanyRegistryDelegationAsDelegator";
import { CompanyRegistryDelegationAsDelegate } from "./CompanyRegistryDelegationAsDelegate";
import { CompanyRegistryDndFromBsd } from "./CompanyRegistryDndFromBsd";

interface Props {
  company: CompanyPrivate;
}

export const CompanyRegistry = ({ company }: Props) => {
  return (
    <>
      <CompanyRegistryDelegationAsDelegator company={company} />
      <CompanyRegistryDelegationAsDelegate company={company} />
      <CompanyRegistryDndFromBsd company={company} />
    </>
  );
};
