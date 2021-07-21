import React, { useState } from "react";
import { Field, useFormikContext } from "formik";
import CompanySelector from "form/common/components/company/CompanySelector";
import { Bsda } from "generated/graphql/types";
import { RedErrorMessage } from "common/components";
import DateInput from "form/common/components/custom-inputs/DateInput";

export function Worker({ disabled }) {
  const { setFieldValue, values } = useFormikContext<Bsda>();
  const [hasBroker, setHasBroker] = useState(Boolean(false)); // TODO after rebase: Boolean(values.broker.company.siret != null)

  return (
    <>
      {disabled && (
        <div className="notification notification--error">
          Les champs grisés ci-dessous ont été scellés via signature et ne sont
          plus modifiables.
        </div>
      )}

      <div className="form__row">
        <label>
          <input
            type="checkbox"
            onChange={() => setHasBroker(!hasBroker)}
            disabled={disabled}
            checked={hasBroker}
            className="td-checkbox"
          />
          Je suis passé par un courtier
        </label>
      </div>

      <CompanySelector
        disabled={disabled}
        name="worker.company"
        heading="Entreprise de travaux"
      />

      {hasBroker && (
        <div className="form__row">
          <h4 className="form__section-heading">Courtier</h4>
          <CompanySelector
            name="broker.company"
            onCompanySelected={broker => {
              if (broker.brokerReceipt) {
                setFieldValue(
                  "broker.receipt",
                  broker.brokerReceipt.receiptNumber
                );
                setFieldValue(
                  "broker.validityLimit",
                  broker.brokerReceipt.validityLimit
                );
                setFieldValue(
                  "broker.department",
                  broker.brokerReceipt.department
                );
              } else {
                setFieldValue("broker.receipt", "");
                setFieldValue("broker.validityLimit", null);
                setFieldValue("broker.department", "");
              }
            }}
          />

          <div className="form__row">
            <label>
              Numéro de récépissé
              <Field
                type="text"
                name="broker.receipt"
                className="td-input td-input--medium"
              />
            </label>

            <RedErrorMessage name="broker.receipt" />
          </div>
          <div className="form__row">
            <label>
              Département
              <Field
                type="text"
                name="broker.department"
                placeholder="Ex: 83"
                className="td-input td-input--small"
              />
            </label>

            <RedErrorMessage name="broker.department" />
          </div>
          <div className="form__row">
            <label>
              Limite de validité
              <Field
                component={DateInput}
                name="broker.validityLimit"
                className="td-input td-input--small"
              />
            </label>

            <RedErrorMessage name="broker.validityLimit" />
          </div>
        </div>
      )}
    </>
  );
}
