import React from "react";
import gql from "graphql-tag";
import { Company } from "./AccountCompany";

type Props = {
  company: Company;
};

AccountCompanyPage.fragments = {
  company: gql`
    fragment AccountCompanyPageFragment on CompanyPrivate {
      siret
    }
  `
};

export default function AccountCompanyPage({ company }: Props) {
  const companyPage =
    `${process.env.REACT_APP_URL_SCHEME}://` +
    `${process.env.REACT_APP_HOSTNAME}` +
    `/company/${company.siret}`;

  return (
    <>
      <div className="notification">
        Ces éléments sont destinés à apparaitre sur votre fiche entreprise
        disponible à l'adresse{" "}
        <a href={companyPage} target="_blank">
          {companyPage}
        </a>{" "}
        et librement consultable par les utilisateurs de Trackdéchets.
      </div>
    </>
  );
}
