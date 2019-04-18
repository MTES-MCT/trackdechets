import React from "react";
import { Formik, Field, Form } from "formik";
import DateInput from "../../../form/custom-inputs/DateInput";
import { SlipActionProps } from "../SlipActions";
import { Operations } from "../../../form/processing-operation/ProcessingOperation";
import { DateTime } from "luxon";

export default function Processed(props: SlipActionProps) {
  return (
    <div>
      <Formik
        initialValues={{
          processingOperationDone: "",
          processedBy: "",
          processedAt: DateTime.local().toISODate(),
          nextDestinationProcessingOperation: "",
          nextDestinationDetails: "",
          noTraceability: false
        }}
        onSubmit={values => props.onSubmit({ info: values })}
      >
        {({ values }) => (
          <Form>
            <label>
              Nom du responsable
              <Field type="text" name="processedBy" placeholder="NOM Prénom" />
            </label>
            <label>
              Date de réception
              <Field component={DateInput} name="processedAt" />
            </label>
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
              <span>
                Opération de traitement prévue:{" "}
                {props.form.recipient.processingOperation}
              </span>
            </label>
            {["D 13", "D 14", "D 15", "R 13"].indexOf(
              values.processingOperationDone
            ) > -1 && (
              <div>
                <h4>Destination ultérieure prévue</h4>
                <div>
                  <label>
                    <Field type="checkbox" name="noTraceability" />
                    C'est un regroupement avec perte de traçabilité
                  </label>
                </div>
                <label>
                  Opération de traitement
                  <Field
                    component="select"
                    name="nextDestinationProcessingOperation"
                  >
                    <option value="">Choisissez...</option>
                    {Operations.map(o => (
                      <option key={o.code} value={o.code}>
                        {o.code} - {o.description.substr(0, 50)}
                        {o.description.length > 50 ? "..." : ""}
                      </option>
                    ))}
                  </Field>
                </label>
                <label>
                  Entreprise
                  <Field
                    component="textarea"
                    className="textarea-pickup-site"
                    placeholder="Siret / Nom / Adresse..."
                    name="nextDestinationDetails"
                  />
                </label>
              </div>
            )}
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
