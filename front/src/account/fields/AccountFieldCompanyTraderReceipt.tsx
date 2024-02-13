import React from "react";
import { gql } from "@apollo/client";
import { formatDate } from "../../common/datetime";
import AccountField from "./AccountField";
import AccountFormCompanyTraderReceipt from "./forms/AccountFormCompanyTraderReceipt";
import { CompanyPrivate, UserRole } from "@td/codegen-ui";
import AccountFieldNotEditable from "./AccountFieldNotEditable";

type Props = {
  company: Pick<CompanyPrivate, "id" | "siret" | "traderReceipt" | "userRole">;
};

AccountFieldCompanyTraderReceipt.fragments = {
  company: gql`
    fragment AccountFieldCompanyTraderReceiptFragment on CompanyPrivate {
      id
      siret
      userRole
      traderReceipt {
        id
        receiptNumber
        validityLimit
        department
      }
    }
  `
};

export default function AccountFieldCompanyTraderReceipt({ company }: Props) {
  const traderReceipt = company.traderReceipt ? (
    <table>
      <tbody>
        <tr>
          <td> Numéro de récépissé </td>
          <td data-testid="receiptNumber">
            {company.traderReceipt.receiptNumber}{" "}
          </td>
        </tr>
        <tr>
          <td> Limite de validité </td>
          <td data-testid="receiptValidityLimit">
            {formatDate(company.traderReceipt.validityLimit)}
          </td>
        </tr>
        <tr>
          <td> Département</td>
          <td data-testid="receiptDepartment">
            {company.traderReceipt.department}{" "}
          </td>
        </tr>
      </tbody>
    </table>
  ) : null;

  return company.userRole === UserRole.Admin ? (
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
  ) : (
    <AccountFieldNotEditable
      name="traderReceipt"
      label="Récépissé négociant"
      value={traderReceipt}
    />
  );
}
