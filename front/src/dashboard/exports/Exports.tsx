import { gql } from "@apollo/client";
import React from "react";
import { CompanyPrivate } from "@td/codegen-ui";
import ExportsForm from "./ExportsForm";

interface IProps {
  companies: CompanyPrivate[];
}

Exports.fragments = {
  company: gql`
    fragment ExportsCompanyFragment on CompanyPrivate {
      ...ExportsFormCompanyFragment
    }
    ${ExportsForm.fragments.company}
  `
};

export default function Exports({ companies }: IProps) {
  return (
    <div className="tw-p-6">
      <h2 className="h2 tw-mb-4">Exporter un registre</h2>
      <ExportsForm companies={companies} />
    </div>
  );
}
