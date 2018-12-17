import React from "react";
import { Formik, Field, Form } from "formik";
import { DateTime } from "luxon";
import NumberInput from "../../../form/custom-inputs/NumberInput";
import DateInput from "../../../form/custom-inputs/DateInput";
import { SlipActionProps } from "../SlipActions";

export default function Received(props: SlipActionProps) {
  return (
    <div>
      <Formik
        initialValues={{
          isAccepted: true,
          receivedBy: "",
          receivedAt: DateTime.local().toISODate(),
          quantityReceived: ""
        }}
        onSubmit={values => props.onSubmit({ info: values })}
      >
        {({ isSubmitting }) => (
          <Form>
            <label>
              Acceptation du déchet
              <Field type="checkbox" name="isAccepted" />
            </label>
            <label>
              Nom du responsable
              <Field type="text" name="receivedBy" placeholder="NOM Prénom" />
            </label>
            <label>
              Date de réception
              <Field component={DateInput} name="receivedAt" />
            </label>
            <label>
              Poids à l'arrivée
              <Field
                component={NumberInput}
                name="quantityReceived"
                placeholder="En tonnes"
              />
            </label>
            <p>
              En validant, je confirme la réception des déchets indiqués dans ce
              bordereau.
            </p>
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
