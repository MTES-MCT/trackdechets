import React from "react";
import { gql } from "@apollo/client";
import { formatDate } from "common/datetime";
import AccountField from "./AccountField";
import { CompanyPrivate } from "generated/graphql/types";
import AccountFormCompanyTransporterReceipt from "./forms/AccountFormCompanyTransporterReceipt";

type Props = {
  company: Pick<CompanyPrivate, "id" | "siret" | "transporterReceipt">;
};

AccountFieldCompanyTransporterReceipt.fragments = {
  company: gql`
    fragment AccountFieldCompanyTransporterReceiptFragment on CompanyPrivate {
      id
      siret
      transporterReceipt {
        id
        receiptNumber
        validityLimit
        department
      }
    }
  `,
};

export default function AccountFieldCompanyTransporterReceipt({
  company,
}: Props) {
  const transporterReceipt = company.transporterReceipt ? (
    <table>
      <tbody>
        <tr>
          <td> Numéro de récépissé </td>
          <td>{company.transporterReceipt.receiptNumber} </td>
        </tr>
        <tr>
          <td> Limite de validité </td>
          <td>{formatDate(company.transporterReceipt.validityLimit)}</td>
        </tr>
        <tr>
          <td> Département</td>
          <td>{company.transporterReceipt.department} </td>
        </tr>
      </tbody>
    </table>
  ) : null;

  return (
    <AccountField
      name="transporterReceipt"
      label="Récépissé transporteur"
      value={transporterReceipt}
      renderForm={toggleEdition => (
        <AccountFormCompanyTransporterReceipt
          company={company}
          toggleEdition={toggleEdition}
        />
      )}
    />
  );
}
