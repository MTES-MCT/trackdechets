import React from "react";
import { gql } from "@apollo/client";
import { formatDate } from "../../../common/datetime";
import AccountField from "./AccountField";
import { CompanyPrivate, UserRole } from "@td/codegen-ui";
import AccountFormCompanyTransporterReceipt from "./forms/AccountFormCompanyTransporterReceipt";
import AccountFieldNotEditable from "./AccountFieldNotEditable";

type Props = {
  company: Pick<
    CompanyPrivate,
    "id" | "siret" | "transporterReceipt" | "userRole"
  >;
};

AccountFieldCompanyTransporterReceipt.fragments = {
  company: gql`
    fragment AccountFieldCompanyTransporterReceiptFragment on CompanyPrivate {
      id
      siret
      userRole
      transporterReceipt {
        id
        receiptNumber
        validityLimit
        department
      }
    }
  `
};

export default function AccountFieldCompanyTransporterReceipt({
  company
}: Props) {
  const transporterReceipt = company.transporterReceipt ? (
    <table>
      <tbody>
        <tr>
          <td> Numéro de récépissé </td>
          <td data-testid="receiptNumber">
            {company.transporterReceipt.receiptNumber}{" "}
          </td>
        </tr>
        <tr>
          <td> Limite de validité </td>
          <td data-testid="receiptValidityLimit">
            {formatDate(company.transporterReceipt.validityLimit)}
          </td>
        </tr>
        <tr>
          <td> Département</td>
          <td data-testid="receiptDepartment">
            {company.transporterReceipt.department}{" "}
          </td>
        </tr>
      </tbody>
    </table>
  ) : null;

  return (
    <>
      {company.userRole === UserRole.Admin ? (
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
      ) : (
        <AccountFieldNotEditable
          name="transporterReceipt"
          label="Récépissé transporteur"
          value={transporterReceipt}
        />
      )}{" "}
    </>
  );
}
