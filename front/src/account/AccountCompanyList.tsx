import React from "react";
import gql from "graphql-tag";
import { filter } from "graphql-anywhere";
import AccountCompany, { Company } from "./AccountCompany";

type Props = {
  companies: [Company];
};

AccountCompanyList.fragments = {
  company: gql`
    fragment AccountCompaniesFragment on Company {
      ...AccountCompanyFragment
    }
    ${AccountCompany.fragments.company}
  `
};

export default function AccountCompanyList({ companies }: Props) {
  return (
    <>
      {companies.map(company => (
        <AccountCompany
          key={company.siret}
          company={filter(AccountCompany.fragments.company, company)}
        />
      ))}
    </>
  );
}
