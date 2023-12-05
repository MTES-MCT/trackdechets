import React from "react";
import { gql } from "@apollo/client";
import AccountField from "./AccountField";
import { CompanyPrivate, UserRole } from "codegen-ui";
import AccountFormCompanyVhuAgrementDemolisseur from "./forms/AccountFormCompanyAddVhuAgrementDemolisseur";
import AccountFieldNotEditable from "./AccountFieldNotEditable";

type Props = {
  company: Pick<
    CompanyPrivate,
    "id" | "siret" | "vhuAgrementDemolisseur" | "userRole"
  >;
};

AccountFieldCompanyVhuAgrementDemolisseur.fragments = {
  company: gql`
    fragment AccountFieldCompanyVhuAgrementDemolisseurFragment on CompanyPrivate {
      id
      siret
      userRole
      vhuAgrementDemolisseur {
        id
        agrementNumber
        department
      }
    }
  `
};

export default function AccountFieldCompanyVhuAgrementDemolisseur({
  company
}: Props) {
  const vhuAgrementDemolisseur = company.vhuAgrementDemolisseur ? (
    <table>
      <tbody>
        <tr>
          <td> Numéro de récépissé </td>
          <td>{company.vhuAgrementDemolisseur.agrementNumber} </td>
        </tr>
        <tr>
          <td> Département</td>
          <td>{company.vhuAgrementDemolisseur.department} </td>
        </tr>
      </tbody>
    </table>
  ) : null;

  return company.userRole === UserRole.Admin ? (
    <AccountField
      name="vhuAgrementDemolisseur"
      label="Agrément Demolisseur VHU"
      value={vhuAgrementDemolisseur}
      renderForm={toggleEdition => (
        <AccountFormCompanyVhuAgrementDemolisseur
          company={company}
          toggleEdition={toggleEdition}
        />
      )}
    />
  ) : (
    <AccountFieldNotEditable
      name="vhuAgrementDemolisseur"
      label="Agrément Demolisseur VHU"
      value={vhuAgrementDemolisseur}
    />
  );
}
