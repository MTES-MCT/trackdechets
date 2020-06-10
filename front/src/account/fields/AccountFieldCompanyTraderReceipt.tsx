import React from "react";
import gql from "graphql-tag";
import AccountField from "./AccountField";
import AccountFormCompanyTraderReceipt from "./forms/AccountFormCompanyTraderReceipt";
import { CompanyPrivate } from "../../generated/graphql/types";
import { DateTime } from "luxon";

type Props = {
  company: Pick<CompanyPrivate, "id" | "siret" | "traderReceipt">;
};

AccountFieldCompanyTraderReceipt.fragments = {
  company: gql`
    fragment AccountFieldCompanyTraderReceiptFragment on CompanyPrivate {
      id
      siret
      traderReceipt {
        id
        receiptNumber
        validityLimit
        department
      }
    }
  `,
};

export default function AccountFieldCompanyTraderReceipt({ company }: Props) {
  const traderReceipt = company.traderReceipt ? (
    <table>
      <tbody>
        <tr>
          <td> Numéro de récépissé </td>
          <td>{company.traderReceipt.receiptNumber} </td>
        </tr>
        <tr>
          <td> Limite de validité </td>
          <td>
            {DateTime.fromISO(company.traderReceipt.validityLimit).toISODate()}
          </td>
        </tr>
        <tr>
          <td> Département</td>
          <td>{company.traderReceipt.department} </td>
        </tr>
      </tbody>
    </table>
  ) : null;

  return (
    <AccountField
      name="traderReceipt"
      label="Récépissé négociant"
      value={traderReceipt}
      renderForm={toggleEdition => (
        <AccountFormCompanyTraderReceipt
          company={company}
          toggleEdition={toggleEdition}
        />
      )}
    />
  );
}
