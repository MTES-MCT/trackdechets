import React from "react";
import gql from "graphql-tag";
import { filter } from "graphql-anywhere";
import AccountCompany, { Company } from "./AccountCompany";
import { FaPlusCircle } from "react-icons/fa";
import styles from "./AccountCompanyList.module.scss";
import { useHistory, useRouteMatch } from "react-router-dom";

type Props = {
  companies: [Company];
};

AccountCompanyList.fragments = {
  company: gql`
    fragment AccountCompaniesFragment on CompanyPrivate {
      ...AccountCompanyFragment
    }
    ${AccountCompany.fragments.company}
  `
};

export default function AccountCompanyList({ companies }: Props) {
  const history = useHistory();
  const { url } = useRouteMatch();

  return (
    <>
      {companies.map(company => (
        <AccountCompany
          key={company.siret}
          company={filter(AccountCompany.fragments.company, company)}
        />
      ))}

      <div
        className={["panel", styles.addCompany].join(" ")}
        onClick={() => history.push(`${url}/new`)}
      >
        <FaPlusCircle /> <h6>Ajouter un nouvel établissement</h6>
      </div>
    </>
  );
}
