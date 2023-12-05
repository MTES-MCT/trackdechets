import React from "react";
import { gql } from "@apollo/client";
import AccountField from "./AccountField";
import { CompanyPrivate, UserRole } from "codegen-ui";
import AccountFormCompanyVhuAgrementBroyeur from "./forms/AccountFormCompanyAddVhuAgrementBroyeur";
import AccountFieldNotEditable from "./AccountFieldNotEditable";

type Props = {
  company: Pick<
    CompanyPrivate,
    "id" | "siret" | "vhuAgrementBroyeur" | "userRole"
  >;
};

AccountFieldCompanyVhuAgrementBroyeur.fragments = {
  company: gql`
    fragment AccountFieldCompanyVhuAgrementBroyeurFragment on CompanyPrivate {
      id
      siret
      userRole
      vhuAgrementBroyeur {
        id
        agrementNumber
        department
      }
    }
  `
};

export default function AccountFieldCompanyVhuAgrementBroyeur({
  company
}: Props) {
  const vhuAgrementBroyeur = company.vhuAgrementBroyeur ? (
    <table>
      <tbody>
        <tr>
          <td> Numéro de récépissé </td>
          <td>{company.vhuAgrementBroyeur.agrementNumber} </td>
        </tr>
        <tr>
          <td> Département</td>
          <td>{company.vhuAgrementBroyeur.department} </td>
        </tr>
      </tbody>
    </table>
  ) : null;

  return company.userRole === UserRole.Admin ? (
    <AccountField
      name="vhuAgrementBroyeur"
      label="Agrément broyeur VHU"
      value={vhuAgrementBroyeur}
      renderForm={toggleEdition => (
        <AccountFormCompanyVhuAgrementBroyeur
          company={company}
          toggleEdition={toggleEdition}
        />
      )}
    />
  ) : (
    <AccountFieldNotEditable
      name="vhuAgrementBroyeur"
      label="Agrément broyeur VHU"
      value={vhuAgrementBroyeur}
    />
  );
}
