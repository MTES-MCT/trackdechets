import React, { useEffect } from "react";
import { Formik, Field, Form, useFormikContext } from "formik";
import { DateTime } from "luxon";
import {
  PROCESSING_OPERATIONS,
  PROCESSING_OPERATIONS_GROUPEMENT_CODES,
} from "src/generated/constants";
import DateInput from "src/form/custom-inputs/DateInput";
import CompanySelector from "src/form/company/CompanySelector";
import { SlipActionProps } from "./SlipActions";
import { MutationMarkAsProcessedArgs } from "src/generated/graphql/types";

function Processed(props: SlipActionProps) {
  const {
    values: { processingOperationDone, nextDestination },
    setFieldValue,
  } = useFormikContext<MutationMarkAsProcessedArgs["processedInfo"]>();

  useEffect(() => {
    if (
      PROCESSING_OPERATIONS_GROUPEMENT_CODES.includes(processingOperationDone)
    ) {
      if (nextDestination == null) {
        setFieldValue("nextDestination", {
          processingOperation: "",
          company: {
            siret: "",
            name: "",
            address: "",
            contact: "",
            mail: "",
            phone: "",
          },
        });
      }
    } else {
      setFieldValue("nextDestination", null);
    }
  }, [processingOperationDone, nextDestination, setFieldValue]);

  return (
    <Form>
      <div className="form__row">
        <label>
          Nom du responsable
          <Field
            type="text"
            name="processedBy"
            placeholder="NOM Prénom"
            className="td-input"
          />
        </label>
      </div>
      <div className="form__row">
        <label>
          Date de traitement
          <Field
            component={DateInput}
            name="processedAt"
            className="td-input"
          />
        </label>
      </div>
      <div className="form__row">
        <label>Opération d’élimination / valorisation effectuée</label>
        <Field
          component="select"
          name="processingOperationDone"
          className="td-select"
        >
          <option value="">Choisissez...</option>
          {PROCESSING_OPERATIONS.map(operation => (
            <option key={operation.code} value={operation.code}>
              {operation.code} - {operation.description.substr(0, 50)}
              {operation.description.length > 50 ? "..." : ""}
            </option>
          ))}
        </Field>
        <div>
          Code de traitement initialement prévu par le producteur:{" "}
          {props.form.recipient?.processingOperation}
        </div>
      </div>
      <div className="form__row">
        <label>
          Description de l'Opération
          <Field
            component="textarea"
            name="processingOperationDescription"
            className="td-textarea"
          />
        </label>
      </div>
      <div className="form__row form__row--inline">
        <Field
          type="checkbox"
          name="noTraceability"
          id="id_noTraceability"
          className="td-checkbox"
        />

        <label htmlFor="id_noTraceability">
          {" "}
          Rupture de traçabilité autorisée par arrêté préfectoral pour ce déchet
          - la responsabilité du producteur du déchet est transférée
        </label>
      </div>
      {nextDestination && (
        <div className="form__row">
          <h4>Destination ultérieure prévue</h4>
          <CompanySelector
            name="nextDestination.company"
            allowForeignCompanies
          />

          <div className="form__row">
            <label>Opération d’élimination / valorisation (code D/R)</label>
            <Field
              component="select"
              name="nextDestination.processingOperation"
              className="td-select"
            >
              <option value="">Choisissez...</option>
              {PROCESSING_OPERATIONS.map(operation => (
                <option key={operation.code} value={operation.code}>
                  {operation.code} - {operation.description.substr(0, 50)}
                  {operation.description.length > 50 ? "..." : ""}
                </option>
              ))}
            </Field>
          </div>
        </div>
      )}
      <div className="form__actions">
        <button
          type="button"
          className="btn btn--outline-primary"
          onClick={props.onCancel}
        >
          Annuler
        </button>
        <button type="submit" className="btn btn--primary">
          Je valide
        </button>
      </div>
    </Form>
  );
}

export default function ProcessedWrapper(props: SlipActionProps) {
  return (
    <div>
      <Formik
        initialValues={{
          processingOperationDone: "",
          processingOperationDescription: "",
          processedBy: "",
          processedAt: DateTime.local().toISODate(),
          nextDestination: null,
          noTraceability: false,
        }}
        onSubmit={values => props.onSubmit({ info: values })}
      >
        <Processed {...props} />
      </Formik>
    </div>
  );
}
