import * as React from "react";
import { getcompanyCountry } from "../../../common/pdf/components/FormCompanyFields";
import { FormCompany } from "../../../generated/graphql/types";

type FormCompanyFieldsProps = {
  readonly company?: FormCompany | null;
  readonly displayCountryInfo?: boolean;
};

export function FormCompanyFields({
  company,
  displayCountryInfo = true
}: FormCompanyFieldsProps) {
  const companyCountry = getcompanyCountry(company);

  return (
    <>
      {displayCountryInfo && (
        <p>
          Entreprise{" "}
          <input
            type="checkbox"
            checked={companyCountry && companyCountry?.cca2 === "FR"}
            readOnly
          />
          française
          {"  "}
          <input
            type="checkbox"
            checked={companyCountry && companyCountry?.cca2 !== "FR"}
            readOnly
          />{" "}
          étrangère
        </p>
      )}
      <p>
        N° SIRET : {company?.siret}
        <br />
        {!!company?.vatNumber && (
          <>
            N° TVA intracommunautaire (le cas échéant) : {company?.vatNumber}
            <br />
          </>
        )}
        RAISON SOCIALE : {company?.name}
        <br />
        Adresse complète : {company?.address}
        <br />
        {displayCountryInfo && (
          <>
            {companyCountry === null || companyCountry?.cca2 === "FR" ? null : (
              <span>Pays: {companyCountry?.name.common} </span>
            )}
          </>
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
