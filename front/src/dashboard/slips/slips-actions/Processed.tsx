import React from "react";
import { Formik, Field, Form } from "formik";
import { DateTime } from "luxon";
import DateInput from "../../../form/custom-inputs/DateInput";
import CompanySelector from "../../../form/company/CompanySelector";
import { useProcessingOperations } from "../../../hooks";
import { SlipActionProps } from "../SlipActions";

export default function Processed(props: SlipActionProps) {
  const processingOperations = useProcessingOperations();
  return (
    <div>
      <Formik
        initialValues={{
          processingOperationDone: "",
          processingOperationDescription: "",
          processedBy: "",
          processedAt: DateTime.local().toISODate(),
          nextDestination: {
            processingOperation: "",
            company: {
              siret: "",
              name: "",
              address: "",
              contact: "",
              mail: "",
              phone: "",
            },
          },
          noTraceability: false,
        }}
        onSubmit={values => props.onSubmit({ info: values })}
      >
        {({ values }) => (
          <Form>
            <div className="form__group">
              <label>
                Nom du responsable
                <Field
                  type="text"
                  name="processedBy"
                  placeholder="NOM Prénom"
                />
              </label>
            </div>
            <div className="form__group">
              <label>
                Date de traitement
                <Field component={DateInput} name="processedAt" />
              </label>
            </div>
            <div className="form__group">
              <label>Opération d’élimination / valorisation effectuée</label>
              <Field component="select" name="processingOperationDone">
                <option value="">Choisissez...</option>
                {processingOperations.map(o => (
                  <option key={o.code} value={o.code}>
                    {o.code} - {o.description.substr(0, 50)}
                    {o.description.length > 50 ? "..." : ""}
                  </option>
                ))}
              </Field>
              <div>
                Code de traitement initialement prévu par le producteur:{" "}
                {props.form.recipient?.processingOperation}
              </div>
            </div>
            <div className="form__group">
              <label>
                Description de l'Opération
                <Field
                  component="textarea"
                  name="processingOperationDescription"
                />
              </label>
            </div>
            <div className="form__group">
              <label>
                <Field type="checkbox" name="noTraceability" />
                Rupture de traçabilité autorisée par arrêté préfectoral pour ce
                déchet - la responsabilité du producteur du déchet est
                transférée
              </label>
            </div>
            {["D 13", "D 14", "D 15", "R 12", "R 13"].indexOf(
              values.processingOperationDone
            ) > -1 && (
              <div className="form__group">
                <h4>Destination ultérieure prévue</h4>
                <CompanySelector name="nextDestination.company" />

                <div className="form__group">
                  <label>
                    Opération d’élimination / valorisation (code D/R)
                  </label>
                  <Field
                    component="select"
                    name="nextDestination.processingOperation"
                  >
                    <option value="">Choisissez...</option>
                    {processingOperations.map(o => (
                      <option key={o.code} value={o.code}>
                        {o.code} - {o.description.substr(0, 50)}
                        {o.description.length > 50 ? "..." : ""}
                      </option>
                    ))}
                  </Field>
                </div>
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
