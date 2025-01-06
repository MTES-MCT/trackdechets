import * as React from "react";
import type { FormCompany } from "@td/codegen-back";

type Props = {
  company?: FormCompany | null;
};

export function CompanyDescription({ company }: Readonly<Props>) {
  return (
    <p>
      N° SIRET : {company?.siret}
      <br />
      {!!company?.vatNumber && (
        <>
          N° TVA intracommunautaire (le cas échéant) : {company?.vatNumber}
          <br />
        </>
      )}
      Nom (raison sociale) : {company?.name}
      <br />
      Adresse : {company?.address}
    </p>
  );
}

export function CompanyContact({ company }: Readonly<Props>) {
  return (
    <p>
      Tel : {company?.phone}
      <br />
      Mail : {company?.mail}
      <br />
      Personne à contacter : {company?.contact}
    </p>
  );
}
