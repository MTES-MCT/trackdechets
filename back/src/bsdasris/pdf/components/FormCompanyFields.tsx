import * as React from "react";
import countries from "world-countries";
import { FormCompany } from "../../../generated/graphql/types";

const FRENCH_COUNTRY = countries.find(country => country.cca2 === "FR");

type FormCompanyFieldsProps = {
  company?: FormCompany;
  showCountryFields?: Boolean;
};

export function FormCompanyFields({
  company,
  showCountryFields
}: FormCompanyFieldsProps) {
  const companyCountry = company
    ? countries.find(country => country.cca2 === company?.country) ??
      FRENCH_COUNTRY
    : null;

  return (
    <>
      <p>
        Entreprise{" "}
        <input
          type="checkbox"
          checked={companyCountry && companyCountry.cca2 === "FR"}
          readOnly
        />
        française
        {"  "}
        <input
          type="checkbox"
          checked={companyCountry && companyCountry.cca2 !== "FR"}
          readOnly
        />{" "}
        étrangère
      </p>
      <p>
        N° SIRET : {company?.siret}
        <br />
        {company?.vatNumber!! && (
          <>
            N° TVA intracommunautaire (le cas échéant) : {company?.vatNumber}
            <br />
          </>
        )}
        RAISON SOCIALE : {company?.name}
        <br />
        Adresse complète : {company?.address}
        <br />
        {companyCountry == null || companyCountry.cca2 === "FR" ? null : (
          <span>Pays: {companyCountry.name.common} </span>
        )}
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
