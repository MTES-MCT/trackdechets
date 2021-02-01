import React from "react";
import { Field } from "formik";
import RedErrorMessage from "common/components/RedErrorMessage";
import styles from "../AccountCompanyAdd.module.scss";
import DateInput from "../../form/custom-inputs/DateInput";

/**
 * Broker receipt Formik fields for company creation
 */
export default function AccountCompanyAddBrokerReceipt() {
  return (
    <div className={styles.field}>
      <label className={`text-right ${styles.bold}`}>
        Récépissé Courtier (optionnel)
      </label>
      <div className={styles.field__value}>
        <table>
          <tbody>
            <tr>
              <td>Numéro de récépissé</td>
              <td>
                <Field type="text" name="brokerReceiptNumber" />
                <RedErrorMessage name="brokerReceiptNumber" />
              </td>
            </tr>
            <tr>
              <td>Limite de validité</td>
              <td>
                <Field name="brokerReceiptValidity" component={DateInput} />
                <RedErrorMessage name="brokerReceiptValidity" />
              </td>
            </tr>
            <tr>
              <td>Département</td>
              <td>
                <Field
                  type="text"
                  name="brokerReceiptDepartment"
                  placeholder="75"
                />
                <RedErrorMessage name="brokerReceiptDepartment" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
