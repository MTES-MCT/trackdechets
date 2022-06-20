import * as React from "react";
import countries, { Country } from "world-countries";
import { checkVAT } from "jsvat";
import { countries as vatCountries } from "../../../common/constants/companySearchHelpers";
import { FormCompany } from "../../../generated/graphql/types";

const FRENCH_COUNTRY = countries.find(country => country.cca2 === "FR");

type FormCompanyFieldsProps = {
  company?: FormCompany;
  isForeignShip?: boolean;
  isPrivateIndividual?: boolean;
};

export function FormCompanyFields({
  company,
  isForeignShip,
  isPrivateIndividual
}: FormCompanyFieldsProps) {
  let companyCountry: Country = null;

  if (company) {
    companyCountry =
      countries.find(country => country.cca2 === company?.country) ??
      FRENCH_COUNTRY;
    if (company.vatNumber) {
      const vatCountryCode = checkVAT(company.vatNumber.trim(), vatCountries)
        ?.country?.isoCode.short;

      companyCountry = countries.find(
        country => country.cca2 === vatCountryCode
      );
    }
  }

  return (
    <>
      <p>
        <input
          type="checkbox"
          checked={
            !isForeignShip &&
            !company?.vatNumber &&
            company?.siret &&
            companyCountry &&
            companyCountry.cca2 === "FR"
          }
          readOnly
        />{" "}
        Entreprise française
        <br />
        <input
          type="checkbox"
          checked={
            isForeignShip ||
            (company?.vatNumber &&
              companyCountry &&
              companyCountry.cca2 !== "FR")
          }
          readOnly
        />{" "}
        Entreprise étrangère
      </p>
      <p>
        {!isForeignShip && !isPrivateIndividual && !company?.vatNumber && (
          <div>
            N° SIRET : {company?.siret}
            <br />
          </div>
        )}
        {!isForeignShip && !isPrivateIndividual && (
          <div>
            N° TVA intracommunautaire (le cas échéant) : {company?.vatNumber}
            <br />
          </div>
        )}
        {company?.omiNumber && (
          <div>
            Numéro navire OMI : {company?.omiNumber}
            <br />
          </div>
        )}
        {!company?.siret && !company?.vatNumber
          ? "Nom Prénom"
          : "RAISON SOCIALE"}{" "}
        : {company?.name}
        <br />
        Adresse complète : {company?.address}
        <br />
        Pays (le cas échéant) :{" "}
        {companyCountry == null || companyCountry.cca2 === "FR"
          ? null
          : companyCountry.cca2}
      </p>
      <p>
        Tel : {company?.phone}
        <br />
        Mail (facultatif) : {company?.mail}
        {!isPrivateIndividual && (
          <div>
            <br />
            Personne à contacter : {company?.contact}
          </div>
        )}
      </p>
    </>
  );
}
