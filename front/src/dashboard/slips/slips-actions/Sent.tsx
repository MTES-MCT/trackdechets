import React from "react";
import { Formik, Form, Field } from "formik";
import { DateTime } from "luxon";
import DateInput from "src/form/custom-inputs/DateInput";
import { SlipActionProps } from "./SlipActions";

export default function Sent(props: SlipActionProps) {
  return (
    <div>
      <Formik
        initialValues={{ sentBy: "", sentAt: DateTime.local().toISODate() }}
        onSubmit={values => props.onSubmit({ info: values })}
      >
        {() => (
          <Form>
            <label>
              Nom du responsable
              <Field type="text" name="sentBy" placeholder="NOM Prénom"className="td-input" />
            </label>
            <label>
              Date d'envoi
              <Field component={DateInput} name="sentAt" className="td-input" />
            </label>
            <p>En validant, je confirme les données de ce bordereau.</p>
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
        )}
      </Formik>
    </div>
  );
}
