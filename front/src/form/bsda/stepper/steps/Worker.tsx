import React, { useState } from "react";
import { Field, useFormikContext } from "formik";
import CompanySelector from "form/common/components/company/CompanySelector";
import { Bsda } from "generated/graphql/types";
import { RedErrorMessage } from "common/components";
import DateInput from "form/common/components/custom-inputs/DateInput";
import { getInitialCompany } from "form/bsdd/utils/initial-state";

export function Worker({ disabled }) {
  const { setFieldValue, values } = useFormikContext<Bsda>();
  const hasBroker = Boolean(values.broker);

  function onBrokerToggle() {
    if (hasBroker) {
      setFieldValue("broker", null);
    } else {
      setFieldValue(
        "broker",
        {
          company: getInitialCompany(),
          recepisse: {
            number: "",
            department: "",
            validityLimit: null,
          },
        },
        false
      );
    }
  }

  return (
    <>
      {disabled && (
        <div className="notification notification--error">
          Les champs grisés ci-dessous ont été scellés via signature et ne sont
          plus modifiables.
        </div>
      )}

      <CompanySelector
        disabled={disabled}
        name="worker.company"
        heading="Entreprise de travaux"
      />

      <div className="form__row">
        <label>
          <input
            type="checkbox"
            onChange={onBrokerToggle}
            disabled={disabled}
            checked={hasBroker}
            className="td-checkbox"
          />
          Je suis passé par un courtier
        </label>
      </div>

      {hasBroker && (
        <div className="form__row">
          <h4 className="form__section-heading">Courtier</h4>
          <CompanySelector
            name="broker.company"
            onCompanySelected={broker => {
              if (broker.brokerReceipt) {
                setFieldValue(
                  "broker.recepisse.number",
                  broker.brokerReceipt.receiptNumber
                );
                setFieldValue(
                  "broker.recepisse.validityLimit",
                  broker.brokerReceipt.validityLimit
                );
                setFieldValue(
                  "broker.recepisse.department",
                  broker.brokerReceipt.department
                );
              } else {
                setFieldValue("broker.recepisse.number", "");
                setFieldValue("broker.recepisse.validityLimit", null);
                setFieldValue("broker.recepisse.department", "");
              }
            }}
          />

          <div className="form__row">
            <label>
              Numéro de récépissé
              <Field
                type="text"
                name="broker.recepisse.number"
                className="td-input td-input--medium"
              />
            </label>

            <RedErrorMessage name="broker.recepisse.number" />
          </div>
          <div className="form__row">
            <label>
              Département
              <Field
                type="text"
                name="broker.recepisse.department"
                placeholder="Ex: 83"
                className="td-input td-input--small"
              />
            </label>

            <RedErrorMessage name="broker.recepisse.department" />
          </div>
          <div className="form__row">
            <label>
              Limite de validité
              <Field
                component={DateInput}
                name="broker.recepisse.validityLimit"
                className="td-input td-input--small"
              />
            </label>

            <RedErrorMessage name="broker.recepisse.validityLimit" />
          </div>
        </div>
      )}
    </>
  );
}
