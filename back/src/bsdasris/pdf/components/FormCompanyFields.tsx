import * as React from "react";
import type { FormCompany } from "@td/codegen-back";
import { getcompanyCountry } from "../../../companies/validation";

type FormCompanyFieldsProps = {
  company?: FormCompany | null;
};

export function FormCompanyFields({ company }: FormCompanyFieldsProps) {
  const companyCountry = getcompanyCountry(company);

  return (
    <>
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
        {companyCountry === null || companyCountry?.cca2 === "FR" ? null : (
          <span>Pays: {companyCountry?.name.common} </span>
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
