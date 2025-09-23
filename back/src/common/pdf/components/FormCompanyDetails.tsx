import * as React from "react";
import type { FormCompany } from "@td/codegen-back";
import {
  getReadableCompanyCountry,
  isEUCompany,
  isFrenchCompany
} from "../../../companies/validation";

type FormCompanyDetailsProps = {
  company?: FormCompany | null;
  isForeignShip?: boolean;
  isPrivateIndividual?: boolean;
};

/**
 * Common PDF Company formatting
 * @param company FormCompany
 * @param isForeignShip boolean Emitter is a Foreign Ship
 * @param isPrivateIndividual boolean Emitter is a private person not a company
 */
export function FormCompanyDetails({
  company,
  isForeignShip,
  isPrivateIndividual
}: FormCompanyDetailsProps) {
  return (
    <>
      <p>
        {isFrenchCompany({ company, isForeignShip, isPrivateIndividual }) && (
          <div>
            SIRET : {company?.siret}
            <br />
          </div>
        )}
        {isEUCompany({ company, isForeignShip, isPrivateIndividual }) && (
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
        Pays (le cas échéant) : {getReadableCompanyCountry(company)}
      </p>
      <p>
        Tel : {company?.phone}
        <br />
        {`Mail : `}
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
