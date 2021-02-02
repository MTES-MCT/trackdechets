import React from "react";
import { Field } from "formik";
import RedErrorMessage from "common/components/RedErrorMessage";
import styles from "../AccountCompanyAdd.module.scss";
import DateInput from "../../form/custom-inputs/DateInput";

/**
 * Transporter receipt Formik fields for company creation
 */
export default function AccountCompanyAddTransporterReceipt() {
  return (
    <div className={styles.field}>
      <label className={`text-right ${styles.bold}`}>
        Récépissé Transporteur (optionnel)
      </label>
      <div className={styles.field__value}>
        <table>
          <tbody>
            <tr>
              <td>Numéro de récépissé</td>
              <td>
                <Field
                  type="text"
                  name="transporterReceiptNumber"
                  className="td-input"
                />
                <RedErrorMessage name="transporterReceiptNumber" />
              </td>
            </tr>
            <tr>
              <td>Limite de validité</td>
              <td>
                <Field
                  name="transporterReceiptValidity"
                  component={DateInput}
                  className="td-input"
                />
                <RedErrorMessage name="transporterReceiptValidity" />
              </td>
            </tr>
            <tr>
              <td>Département</td>
              <td>
                <Field
                  type="text"
                  name="transporterReceiptDepartment"
                  placeholder="75"
                  className="td-input"
                />
                <RedErrorMessage name="transporterReceiptDepartment" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
