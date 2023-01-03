import * as React from "react";
import countries, { Country } from "world-countries";
import { checkVAT } from "jsvat";
import {
  countries as vatCountries,
  isVat,
  isSiret
} from "../../../common/constants/companySearchHelpers";
import { FormCompany } from "../../../generated/graphql/types";

const FRENCH_COUNTRY = countries.find(country => country.cca2 === "FR");

type FormCompanyFieldsProps = {
  company?: FormCompany;
  isForeignShip?: boolean;
  isPrivateIndividual?: boolean;
  isEmailMandatory?: boolean;
};

export function FormCompanyFields({
  company,
  isForeignShip,
  isPrivateIndividual,
  isEmailMandatory = true
}: FormCompanyFieldsProps) {
  const companyCountry = getcompanyCountry(company);

  return (
    <>
      <p>
        <input
          type="checkbox"
          checked={
            !!company?.siret?.length &&
            !isForeignShip &&
            companyCountry?.cca2 === "FR"
          }
          readOnly
        />{" "}
        Entreprise française
        <br />
        <input
          type="checkbox"
          checked={
            company?.vatNumber?.length > 0 && companyCountry?.cca2 !== "FR"
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
        {`Mail ${isEmailMandatory ? "" : "(facultatif) "}: `}
        {company?.mail}
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

export function getcompanyCountry(company: FormCompany): Country {
  // reconnaitre le pays directement dans le champ country
  let companyCountry = company
    ? countries.find(country => country.cca2 === company?.country) ??
      FRENCH_COUNTRY // default
    : null;

  if (company && !companyCountry) {
    if (isSiret(company.siret)) {
      // forcer FR si le siret est valide
      companyCountry = countries.find(country => country.cca2 === "FR");
    } else if (isVat(company.vatNumber)) {
      // trouver automatiquement le pays selon le numéro de TVA
      const vatCountryCode = checkVAT(
        company.vatNumber.replace(/[\W_\s]/gim, ""),
        vatCountries
      )?.country?.isoCode.short;

      companyCountry = countries.find(
        country => country.cca2 === vatCountryCode
      );
    }
  }
  return companyCountry;
}
