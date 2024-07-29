import { RedErrorMessage } from "../../../common/components";

import { Field, useFormikContext } from "formik";
import React from "react";
import { BsdasriStatus, Bsdasri, BsdasriType } from "@td/codegen-ui";
import DateInput from "../../common/components/custom-inputs/DateInput";
import NumberInput from "../../common/components/custom-inputs/NumberInput";
import classNames from "classnames";

export default function Operation({ status, disabled = false }) {
  const operationEmphasis = false;
  const { values } = useFormikContext<Bsdasri>();
  const showOperationFields = status === BsdasriStatus.Received;
  return showOperationFields ? (
    <>
      <div
        className={classNames("form__row", {
          "field-emphasis": operationEmphasis
        })}
      >
        <label>Opération réalisée</label>
        <Field
          as="select"
          name="destination.operation.code"
          className="td-select"
          disabled={disabled}
        >
          <option value="">-----</option>

          <option value="D9">
            D9 - Prétraitement par désinfection - Banaliseur
          </option>
          <option value="D10">D10 - Incinération</option>
          <option value="R1">
            R1 - Incinération + valorisation énergétique
          </option>

          {values.type !== BsdasriType.Synthesis ? (
            <>
              <option value="D13">
                D13 - Groupement avant désinfection en D9 ou incinération en D10
                sur un site relevant de la rubrique 2718
              </option>
              <option value="R12">
                R12 - Groupement avant incinération en R1, sur un site relevant
                de la rubrique 2718
              </option>
            </>
          ) : null}
        </Field>
      </div>
      <div
        className={classNames("form__row", {
          "field-emphasis": operationEmphasis
        })}
      >
        <label>
          Date de l'opération :
          <div className="td-date-wrapper">
            <Field
              name="destination.operation.date"
              component={DateInput}
              className="td-input"
              disabled={disabled}
            />
          </div>
        </label>
      </div>

      <h4 className="form__section-heading">Quantité traitée</h4>

      <div
        className={classNames("form__row", {
          "field-emphasis": operationEmphasis
        })}
      >
        <label>
          Poids en kg :
          <Field
            component={NumberInput}
            name="destination.operation.weight.value"
            className="td-input dasri__waste-details__weight"
            placeholder="En kg"
            min="0"
            step="0.1"
            disabled={disabled}
          />
          <span className="tw-ml-2">kg</span>
        </label>

        <RedErrorMessage name="destination.operation.weight.value" />
      </div>
    </>
  ) : (
    <p>Cette section sera disponible quand le déchet aura été reçu</p>
  );
}
