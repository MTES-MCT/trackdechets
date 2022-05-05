import * as React from "react";
import countries from "world-countries";
import { FormCompany } from "../../../generated/graphql/types";

const FRENCH_COUNTRY = countries.find(country => country.cca2 === "FR");

type FormCompanyFieldsProps = {
  company?: FormCompany;
};

export function FormCompanyFields({ company }: FormCompanyFieldsProps) {
  const companyCountry = company
    ? countries.find(country => country.cca2 === company?.country) ??
      FRENCH_COUNTRY
    : null;

  return (
    <>
      <p>
        <input
          type="checkbox"
          checked={
            company?.siret && companyCountry && companyCountry.cca2 === "FR"
          }
          readOnly
        />{" "}
        Entreprise française
        <br />
        <input
          type="checkbox"
          checked={
            company?.siret && companyCountry && companyCountry.cca2 !== "FR"
          }
          readOnly
        />{" "}
        Entreprise étrangère
      </p>
      <p>
        N° SIRET : {company?.siret}
        <br />
        N° TVA intracommunautaire (le cas échéant) :<br />
        RAISON SOCIALE : {company?.name}
        <br />
        Adresse complète : {company?.address}
        <br />
        Pays (le cas échéant) :{" "}
        {companyCountry == null || companyCountry.cca2 === "FR"
          ? null
          : companyCountry.name.common}
      </p>
      <p>
        Tel : {company?.phone}
        <br />
        Mail (facultatif) : {company?.mail}
        <br />
        Personne à contacter : {company?.contact}
      </p>
    </>
  );
}
