import React from "react";
import { gql } from "@apollo/client";
import AccountField from "./AccountField";
import { CompanyPrivate } from "generated/graphql/types";
import AccountFormCompanyVhuAgrementDemolisseur from "./forms/AccountFormCompanyAddVhuAgrementDemolisseur";

type Props = {
  company: Pick<CompanyPrivate, "id" | "siret" | "vhuAgrementDemolisseur">;
};

AccountFieldCompanyVhuAgrementDemolisseur.fragments = {
  company: gql`
    fragment AccountFieldCompanyVhuAgrementDemolisseurFragment on CompanyPrivate {
      id
      siret
      vhuAgrementDemolisseur {
        id
        agrementNumber
        department
      }
    }
  `,
};

export default function AccountFieldCompanyVhuAgrementDemolisseur({
  company,
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

  return (
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
  );
}
