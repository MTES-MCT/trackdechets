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

  const isSiretCompany =
    isSiret(company?.siret) &&
    !isForeignShip &&
    !isPrivateIndividual &&
    companyCountry?.cca2 === "FR";

  const isEUCompany =
    isVat(company?.vatNumber) && !isForeignShip && !isPrivateIndividual;

  return (
    <>
      <p>
        <input type="checkbox" checked={isSiretCompany} readOnly /> Entreprise
        française
        <br />
        <input
          type="checkbox"
          checked={
            Boolean(
              company?.extraEuropeanId || company?.vatNumber || isForeignShip
            ) && companyCountry?.cca2 !== "FR"
          }
          readOnly
        />{" "}
        Entreprise étrangère
      </p>
      <p>
        {isSiretCompany && (
          <div>
            N° SIRET : {company?.siret}
            <br />
          </div>
        )}
        {isEUCompany && (
          <div>
            N° TVA intracommunautaire (le cas échéant) : {company?.vatNumber}
            <br />
          </div>
        )}
        {company?.extraEuropeanId && (
          <div>
            Identifiant d'entreprise extra-européenne :{" "}
            {company?.extraEuropeanId}
            <br />
          </div>
        )}
        {company?.omiNumber && (
          <div>
            Numéro navire OMI : {company?.omiNumber}
            <br />
          </div>
        )}
        {isPrivateIndividual ||
        (!company?.siret && !company?.vatNumber && !company?.extraEuropeanId)
          ? "Nom Prénom"
          : "RAISON SOCIALE"}{" "}
        : {company?.name}
        <br />
        Adresse complète : {company?.address}
        <br />
        Pays (le cas échéant) :{" "}
        {!companyCountry || companyCountry?.cca2 === "FR"
          ? "France"
          : companyCountry?.name?.common || companyCountry?.cca2}
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
