import React from "react";
import { gql } from "@apollo/client";
import { formatDate } from "common/datetime";
import AccountField from "./AccountField";
import AccountFormCompanyBrokerReceipt from "./forms/AccountFormCompanyBrokerReceipt";
import { CompanyPrivate } from "generated/graphql/types";

type Props = {
  company: Pick<CompanyPrivate, "id" | "siret" | "brokerReceipt">;
};

AccountFieldCompanyBrokerReceipt.fragments = {
  company: gql`
    fragment AccountFieldCompanyBrokerReceiptFragment on CompanyPrivate {
      id
      siret
      brokerReceipt {
        id
        receiptNumber
        validityLimit
        department
      }
    }
  `,
};

export default function AccountFieldCompanyBrokerReceipt({ company }: Props) {
  const brokerReceipt = company.brokerReceipt ? (
    <table>
      <tbody>
        <tr>
          <td> Numéro de récépissé </td>
          <td>{company.brokerReceipt.receiptNumber} </td>
        </tr>
        <tr>
          <td> Limite de validité </td>
          <td>{formatDate(company.brokerReceipt.validityLimit)}</td>
        </tr>
        <tr>
          <td> Département</td>
          <td>{company.brokerReceipt.department} </td>
        </tr>
      </tbody>
    </table>
  ) : null;

  return (
    <AccountField
      name="brokerReceipt"
      label="Récépissé courtier"
      value={brokerReceipt}
      renderForm={toggleEdition => (
        <AccountFormCompanyBrokerReceipt
          company={company}
          toggleEdition={toggleEdition}
        />
      )}
    />
  );
}
