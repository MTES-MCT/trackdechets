import * as React from "react";
import type { FormCompany } from "@td/codegen-back";

type Props = {
  readonly company?: FormCompany | null;
};

export function CompanyDescription({ company }: Props) {
  return (
    <p>
      SIRET : {company?.siret}
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

export function CompanyContact({ company }: Props) {
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
