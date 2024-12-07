import * as React from "react";
import { FormCompany } from "@td/codegen-back";
import { FormCompanyDetails } from "./FormCompanyDetails";
import {
  isForeignCompany,
  isFrenchCompany
} from "../../../companies/validation";

type FormCompanyFieldsProps = {
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
export function FormCompanyFields({
  company,
  isForeignShip,
  isPrivateIndividual
}: FormCompanyFieldsProps) {
  return (
    <>
      <p>
        <input
          type="checkbox"
          checked={isFrenchCompany({
            company,
            isForeignShip,
            isPrivateIndividual
          })}
          readOnly
        />{" "}
        Entreprise française
        <br />
        <input
          type="checkbox"
          checked={isForeignCompany({ company, isForeignShip })}
          readOnly
        />{" "}
        Entreprise étrangère
      </p>

      <FormCompanyDetails
        company={company}
        isForeignShip={isForeignShip}
        isPrivateIndividual={isPrivateIndividual}
      />
    </>
  );
}
