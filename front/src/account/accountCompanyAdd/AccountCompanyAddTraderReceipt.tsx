import React from "react";
import { Field } from "formik";
import RedErrorMessage from "common/components/RedErrorMessage";
import styles from "../AccountCompanyAdd.module.scss";
import DateInput from "../../form/common/components/custom-inputs/DateInput";

/**
 * Trader receipt Formik fields for company creation
 */
export default function AccountCompanyAddTraderReceipt() {
  return (
    <div className={styles.field}>
      <label className={`text-right ${styles.bold}`}>
        Récépissé Négociant (optionnel)
      </label>
      <div className={styles.field__value}>
        <table>
          <tbody>
            <tr>
              <td>Numéro de récépissé</td>
              <td>
                <Field
                  type="text"
                  name="traderReceiptNumber"
                  className="td-input"
                />
                <RedErrorMessage name="traderReceiptNumber" />
              </td>
            </tr>
            <tr>
              <td>Limite de validité</td>
              <td>
                <Field
                  name="traderReceiptValidity"
                  component={DateInput}
                  className="td-input"
                />
                <RedErrorMessage name="traderReceiptValidity" />
              </td>
            </tr>
            <tr>
              <td>Département</td>
              <td>
                <Field
                  type="text"
                  name="traderReceiptDepartment"
                  placeholder="75"
                  className="td-input"
                />
                <RedErrorMessage name="traderReceiptDepartment" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
