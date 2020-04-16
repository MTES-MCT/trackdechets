import React from "react";
import gql from "graphql-tag";
import AccountField from "./AccountField";
import { Company } from "../AccountCompany";
import AccountFormCompanyTransporterReceipt from "./forms/AccountFormCompanyTransporterReceipt";
import { formatDate } from "../../common/helper";

type Props = {
  company: Pick<Company, "id" | "siret" | "transporterReceipt">;
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
          <td>
            {formatDate(new Date(company.transporterReceipt.validityLimit))}
          </td>
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
      renderForm={(toggleEdition) => (
        <AccountFormCompanyTransporterReceipt
          company={company}
          toggleEdition={toggleEdition}
        />
      )}
    />
  );
}
