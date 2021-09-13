import React from "react";
import { Field, useFormikContext } from "formik";
import CompanySelector from "form/common/components/company/CompanySelector";
import { RedErrorMessage } from "common/components";
import DateInput from "form/common/components/custom-inputs/DateInput";
import { Bsda } from "generated/graphql/types";
import Tooltip from "common/components/Tooltip";
import TagsInput from "form/bsvhu/components/tags-input/TagsInput";
import { transportModeLabels } from "dashboard/constants";

export function Transporter({ disabled }) {
  const { setFieldValue, values } = useFormikContext<Bsda>();

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
        name="transporter.company"
        heading="Entreprise de transport"
        allowForeignCompanies={true}
        onCompanySelected={transporter => {
          if (transporter.transporterReceipt) {
            setFieldValue(
              "transporter.recepisse.number",
              transporter.transporterReceipt.receiptNumber
            );
            setFieldValue(
              "transporter.recepisse.validityLimit",
              transporter.transporterReceipt.validityLimit
            );
            setFieldValue(
              "transporter.recepisse.department",
              transporter.transporterReceipt.department
            );
          } else {
            setFieldValue("transporter.recepisse.number", "");
            setFieldValue("transporter.recepisse.validityLimit", null);
            setFieldValue("transporter.recepisse.department", "");
          }
        }}
      />

      {values.transporter?.company?.siret === null ? (
        <label>
          Numéro de TVA intracommunautaire
          <Field
            type="text"
            name="transporter.company.vatNumber"
            placeholder="Ex: DE 123456789"
            className="td-input"
            disabled={disabled}
          />
        </label>
      ) : (
        <>
          <h4 className="form__section-heading">Autorisations</h4>
          <div className="form__row">
            <label>
              Numéro de récépissé
              <Field
                type="text"
                name="transporter.recepisse.number"
                className="td-input td-input--medium"
                disabled={disabled}
              />
            </label>

            <RedErrorMessage name="transporter.recepisse.number" />

            <label>
              Département
              <Field
                type="text"
                name="transporter.recepisse.department"
                placeholder="Ex: 83"
                className={`td-input td-input--small`}
                disabled={disabled}
              />
            </label>

            <RedErrorMessage name="transporter.recepisse.department" />

            <label>
              Limite de validité
              <Field
                component={DateInput}
                name="transporter.recepisse.validityLimit"
                className={`td-input td-input--small`}
                disabled={disabled}
              />
            </label>

            <RedErrorMessage name="transporter.recepisse.validityLimit" />
          </div>
        </>
      )}

      <h4 className="form__section-heading">Détails</h4>
      <div className="form__row">
        <label>
          Mode de transport:
          <Field
            as="select"
            name="transporter.transport.mode"
            id="id_mode"
            className="td-select td-input--small"
            disabled={disabled}
          >
            {Object.entries(transportModeLabels).map(([k, v]) => (
              <option value={`${k}`} key={k}>
                {v}
              </option>
            ))}
          </Field>
        </label>
      </div>

      <div className="form__row">
        <label>
          Immatriculations
          <Tooltip msg="Saisissez les numéros un par un. Appuyez sur la touche <Entrée> pour valider chacun" />
          <TagsInput name="transporter.transport.plates" disabled={disabled} />
        </label>
      </div>

      <div className="form__row">
        <label>
          Date de prise en charge
          <Field
            component={DateInput}
            name="transporter.transport.takenOverAt"
            className={`td-input td-input--small`}
            disabled={disabled}
          />
        </label>
      </div>
    </>
  );
}
