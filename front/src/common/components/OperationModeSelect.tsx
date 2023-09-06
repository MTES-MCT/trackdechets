import React from "react";
import { Field, Form } from "formik";
import { OperationMode } from "generated/graphql/types";
import { RadioButton } from "form/common/components/custom-inputs/RadioButton";
import RedErrorMessage from "./RedErrorMessage";
import {
  getOperationModeLabel,
  getOperationModesFromOperationCode,
} from "common/operationModes";

const OperationModeSelect = ({ operationCode, name }) => {
  if (!operationCode) return null;

  const modes = getOperationModesFromOperationCode(operationCode);

  if (!modes.length) return null;

  return (
    <Form>
      <div className="form__row">
        <fieldset>
          <legend>Mode de traitement</legend>
          <div className="tw-flex">
            {modes.includes(OperationMode.Elimination) && (
              <Field
                name={name}
                id={OperationMode.Elimination}
                label={getOperationModeLabel(OperationMode.Elimination)}
                component={RadioButton}
              />
            )}
            {modes.includes(OperationMode.Recyclage) && (
              <Field
                name={name}
                id={OperationMode.Recyclage}
                label={getOperationModeLabel(OperationMode.Recyclage)}
                component={RadioButton}
              />
            )}
            {modes.includes(OperationMode.ValorisationEnergetique) && (
              <Field
                name={name}
                id={OperationMode.ValorisationEnergetique}
                label={getOperationModeLabel(
                  OperationMode.ValorisationEnergetique
                )}
                component={RadioButton}
              />
            )}
            {modes.includes(OperationMode.Reutilisation) && (
              <Field
                name={name}
                id={OperationMode.Reutilisation}
                label={getOperationModeLabel(OperationMode.Reutilisation)}
                component={RadioButton}
              />
            )}
          </div>
        </fieldset>

        <RedErrorMessage name={name} />
      </div>
    </Form>
  );
};
export default OperationModeSelect;
