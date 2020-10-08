import gql from "graphql-tag";
import React from "react";
import { CompanyPrivate } from "generated/graphql/types";
import ExportsForm from "./ExportsForm";
import { filter } from "graphql-anywhere";

interface IProps {
  companies: CompanyPrivate[];
}

Exports.fragments = {
  company: gql`
    fragment ExportsCompanyFragment on CompanyPrivate {
      ...ExportsFormCompanyFragment
    }
    ${ExportsForm.fragments.company}
  `,
};

export default function Exports({ companies }: IProps) {
  return (
    <div className="tw-p-6">
      <h2 className="h2 tw-mb-4">Exporter un registre</h2>
      <ExportsForm
        companies={filter(ExportsForm.fragments.company, companies)}
      />
    </div>
  );
}
