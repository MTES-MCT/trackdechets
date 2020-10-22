import React from "react";
import { FaTrash } from "react-icons/fa";
import { Field, FieldArray, useField } from "formik";
import className from "classnames";
import RedErrorMessage from "common/components/RedErrorMessage";
import styles from "../AccountCompanyAdd.module.scss";

export default function AccountCompanyAddEcoOrganisme() {
  const fieldProps = { name: "ecoOrganismeAgreements" };
  const [field] = useField<string[]>(fieldProps);

  return (
    <div className={styles.field}>
      <label className={`text-right ${styles.bold}`}>
        Agréments éco-organisme
      </label>
      <div className={styles.field__value}>
        <table>
          <tbody>
            <tr>
              <td>URL</td>
              <td>
                <FieldArray {...fieldProps}>
                  {({ push, remove }) => (
                    <>
                      {field.value.map((url, index) => (
                        <div key={index} className={styles.inputGroup}>
                          <Field
                            type="url"
                            name={`ecoOrganismeAgreements.${index}`}
                            className={className([
                              "td-input",
                              styles.inputGroupInput,
                            ])}
                          />
                          <button
                            type="button"
                            className="btn btn--outline-danger"
                            onClick={() => remove(index)}
                            aria-label="Supprimer"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        className="btn btn--primary"
                        onClick={() => push("")}
                      >
                        Ajouter un agrément
                      </button>
                    </>
                  )}
                </FieldArray>
                <RedErrorMessage name="ecoOrganismeAgreements" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
