import React from "react";
import gql from "graphql-tag";

type Company = {
  companyTypes: [string];
  naf: string;
};

type Props = { company: Company };

AccountCompanyInfo.fragments = {
  company: gql`
    fragment AccountCompanyInfoFragment on Company {
      companyTypes
      naf
    }
  `
};

export default function AccountCompanyInfo({ company }: Props) {
  return (
    <>
      <div>{company.companyTypes}</div>
      <div>{company.naf}</div>
    </>
  );
}
