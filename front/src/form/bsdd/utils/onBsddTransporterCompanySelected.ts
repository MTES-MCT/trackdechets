import {
  CompanySearchPrivate,
  CompanySearchResult,
} from "generated/graphql/types";

/**
 * Propagates the receipt up to the form when a company is selected or un-selected
 * @param setFieldValue
 * @returns void
 */
export function onBsddTransporterCompanySelected(
  setFieldValue: (
    field: string,
    value: any,
    shouldValidate?: boolean | undefined
  ) => void
): (company?: CompanySearchResult | CompanySearchPrivate | undefined) => void {
  return transporter => {
    if (transporter?.transporterReceipt) {
      setFieldValue(
        "transporter.receipt",
        transporter?.transporterReceipt.receiptNumber
      );
      setFieldValue(
        "transporter.validityLimit",
        transporter?.transporterReceipt.validityLimit
      );
      setFieldValue(
        "transporter.department",
        transporter?.transporterReceipt.department
      );
    } else {
      // empty the receipt when transporter is undefined
      setFieldValue("transporter.receipt", null);
      setFieldValue("transporter.validityLimit", "");
      setFieldValue("transporter.department", null);
    }
  };
}
