import React from "react";
import { gql } from "@apollo/client";
import AccountField from "./AccountField";
import { CompanyPrivate } from "generated/graphql/types";
import AccountFormCompanyVhuAgrementBroyeur from "./forms/AccountFormCompanyAddVhuAgrementBroyeur";

type Props = {
  company: Pick<CompanyPrivate, "id" | "siret" | "vhuAgrementBroyeur">;
};

AccountFieldCompanyVhuAgrementBroyeur.fragments = {
  company: gql`
    fragment AccountFieldCompanyVhuAgrementBroyeurFragment on CompanyPrivate {
      id
      siret
      vhuAgrementBroyeur {
        id
        agrementNumber
        department
      }
    }
  `,
};

export default function AccountFieldCompanyVhuAgrementBroyeur({
  company,
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

  return (
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
  );
}
