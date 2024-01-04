import * as React from "react";
import countries, { Country } from "world-countries";
import { checkVAT } from "jsvat";
import {
  countries as vatCountries,
  isVat,
  isSiret,
  cleanClue
} from "@td/constants";
import { FormCompany } from "../../../generated/graphql/types";

const FRENCH_COUNTRY = countries.find(country => country.cca2 === "FR");

type FormCompanyFieldsProps = {
  company?: FormCompany | null;
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
            !!company?.vatNumber &&
            company.vatNumber.length > 0 &&
            companyCountry?.cca2 !== "FR"
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
        {companyCountry === null || companyCountry?.cca2 === "FR"
          ? null
          : companyCountry?.cca2}
      </p>
      <p>
        Tel : {company?.phone}
        <br />
        {`Mail ${isEmailMandatory ? "" : "(facultatif) "}: `}
        {company?.mail}
        {!isPrivateIndividual && (
          <>
            <br />
            Personne à contacter : {company?.contact}
          </>
        )}
      </p>
    </>
  );
}

export function getcompanyCountry(
  company: FormCompany | null | undefined
): Country | undefined {
  if (!company) return FRENCH_COUNTRY; // default

  // forcer FR si le siret est valide
  if (company.siret && isSiret(company.siret)) {
    return countries.find(country => country.cca2 === "FR");
  } else if (company.vatNumber && isVat(company.vatNumber)) {
    // trouver automatiquement le pays selon le numéro de TVA
    const vatCountryCode = checkVAT(cleanClue(company.vatNumber), vatCountries)
      ?.country?.isoCode.short;

    return countries.find(country => country.cca2 === vatCountryCode);
  }

  // reconnaitre le pays directement dans le champ country
  return countries.find(country => country.cca2 === company.country);
}
