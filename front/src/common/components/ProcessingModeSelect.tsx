import React from "react";
import { Field, Form } from "formik";
import { ProcessingMode } from "generated/graphql/types";
import { RadioButton } from "form/common/components/custom-inputs/RadioButton";
import RedErrorMessage from "./RedErrorMessage";
import { getProcessingModesFromProcessingOperation } from "common/processingModes";

const ProcessingModeSelect = ({ processingOperation }) => {
  if (!processingOperation) return null;

  const modes = getProcessingModesFromProcessingOperation(processingOperation);

  if (!modes.length) return null;

  return (
    <Form>
      <div className="form__row">
        <fieldset>
          <legend>Mode de traitement</legend>
          <div className="tw-flex">
            {modes.includes(ProcessingMode.Elimination) && (
              <Field
                name="processingModeDone"
                id={ProcessingMode.Elimination}
                label="Élimination (incinération sans valorisation énergétique et stockage en décharge)"
                component={RadioButton}
              />
            )}
            {modes.includes(ProcessingMode.Recycling) && (
              <Field
                name="processingModeDone"
                id={ProcessingMode.Recycling}
                label="Recyclage et autres formes de valorisation de la matière"
                component={RadioButton}
              />
            )}
            {modes.includes(ProcessingMode.EnergyRecovery) && (
              <Field
                name="processingModeDone"
                id={ProcessingMode.EnergyRecovery}
                label="Valorisation énergétique"
                component={RadioButton}
              />
            )}
            {modes.includes(ProcessingMode.Reuse) && (
              <Field
                name="processingModeDone"
                id={ProcessingMode.Reuse}
                label="Réutilisation"
                component={RadioButton}
              />
            )}
          </div>
        </fieldset>

        <RedErrorMessage name="processingModeDone" />
      </div>
    </Form>
  );
};
export default ProcessingModeSelect;
