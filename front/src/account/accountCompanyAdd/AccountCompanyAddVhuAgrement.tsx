import React from "react";
import { Field } from "formik";
import RedErrorMessage from "common/components/RedErrorMessage";
import styles from "../AccountCompanyAdd.module.scss";

/**
 * Vhu agrement Formik fields for company creation
 */
export default function AccountCompanyAddVhuAgrement() {
  return (
    <>
      <div className={styles.field}>
        <label className={`text-right ${styles.bold}`}>
          Agrément démolisseur - casse automobile (optionnel)
        </label>
        <div className={styles.field__value}>
          <table>
            <tbody>
              <tr>
                <td>Numéro d'agrément</td>
                <td>
                  <Field
                    type="text"
                    name="vhuAgrementDemolisseurNumber"
                    className="td-input"
                  />
                  <RedErrorMessage name="vhuAgrementDemolisseurNumber" />
                </td>
              </tr>
              <tr>
                <td>Département</td>
                <td>
                  <Field
                    type="text"
                    name="vhuAgrementDemolisseurDepartment"
                    placeholder="75"
                    className="td-input"
                  />
                  <RedErrorMessage name="vhuAgrementDemolisseurDepartment" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className={styles.field}>
        <label className={`text-right ${styles.bold}`}>
          Agrément broyeur (optionnel)
        </label>
        <div className={styles.field__value}>
          <table>
            <tbody>
              <tr>
                <td>Numéro d'agrément</td>
                <td>
                  <Field
                    type="text"
                    name="vhuAgrementBroyeurNumber"
                    className="td-input"
                  />
                  <RedErrorMessage name="vhuAgrementBroyeurNumber" />
                </td>
              </tr>
              <tr>
                <td>Département</td>
                <td>
                  <Field
                    type="text"
                    name="vhuAgrementBroyeurDepartment"
                    placeholder="75"
                    className="td-input"
                  />
                  <RedErrorMessage name="vhuAgrementBroyeurDepartment" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
