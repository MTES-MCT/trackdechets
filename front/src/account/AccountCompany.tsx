import React from "react";
import gql from "graphql-tag";
import Company from "./Company";

export type Company = {
  id: string;
  name: string;
  siret: string;
};

type Props = {
  company: Company;
};

AccountCompany.fragments = {
  company: gql`
    fragment AccountCompanyFragment on Company {
      id
      name
      siret
    }
  `
};

export default function AccountCompany({ company }: Props) {
  return (
    <div className="panel">
      <div>{company.name}</div>
    </div>
  );
}
