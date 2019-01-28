import React from "react";
import { Formik, Field, Form } from "formik";
import { DateTime } from "luxon";
import NumberInput from "../../../form/custom-inputs/NumberInput";
import DateInput from "../../../form/custom-inputs/DateInput";
import { SlipActionProps } from "../SlipActions";
import { Operations } from "../../../form/processing-operation/ProcessingOperation";

export default function Processed(props: SlipActionProps) {
  return (
    <div>
      <Formik
        initialValues={{
          processingOperationDone: ""
        }}
        onSubmit={values => props.onSubmit({ info: values })}
      >
        {({ isSubmitting }) => (
          <Form>
            <label>
              Opération de traitement effectuée
              <Field component="select" name="processingOperationDone">
                <option value="">Choisissez...</option>
                {Operations.map(o => (
                  <option key={o.code} value={o.code}>
                    {o.code} - {o.description.substr(0, 50)}
                    {o.description.length > 50 ? "..." : ""}
                  </option>
                ))}
              </Field>
            </label>
            <div className="form__group button__group">
              <button
                type="button"
                className="button secondary"
                onClick={props.onCancel}
              >
                Annuler
              </button>
              <button type="submit" className="button">
                Je valide
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
}
