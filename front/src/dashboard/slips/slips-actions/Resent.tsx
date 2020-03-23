import React from "react";
import { Formik, Form, Field } from "formik";
import { DateTime } from "luxon";
import DateInput from "../../../form/custom-inputs/DateInput";
import { SlipActionProps } from "../SlipActions";

export default function Resent(props: SlipActionProps) {
  return (
    <div>
      <Formik
        initialValues={{ sentBy: "", sentAt: DateTime.local().toISODate() }}
        onSubmit={values => props.onSubmit({ info: values })}
      >
        {({ isSubmitting }) => (
          <Form>
            <label>
              Nom du responsable
              <Field type="text" name="sentBy" placeholder="NOM Prénom" />
            </label>
            <label>
              Date d'envoi
              <Field component={DateInput} name="sentAt" />
            </label>
            <p>En validant, je confirme les données de ce bordereau.</p>
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
