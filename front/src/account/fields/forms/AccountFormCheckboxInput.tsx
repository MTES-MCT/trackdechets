import React from "react";
import { Formik, Form, Field } from "formik";
import { useMutation } from "@apollo/client";
import RedErrorMessage from "common/components/RedErrorMessage";
import styles from "./AccountForm.module.scss";
import * as Yup from "yup";

type Props = {
  name: string;
  label: string;
  isEditing: boolean;
  value: boolean | null | undefined;
  mutation: any;
  yupSchema?: object;
  toggleEdition: () => void;
};

export default function AccountFormCheckboxInput<Variables>({
  name,
  label,
  value,
  isEditing,
  mutation,
  mutationArgs,
  yupSchema = Yup.object(),
  toggleEdition,
}: Props & { mutationArgs?: Variables }) {
  const [update, { loading }] = useMutation<any, Variables>(mutation, {
    onCompleted: () => {
      toggleEdition();
    },
  });

  const initialValues = {} as Variables;
  initialValues[name] = value;

  return (
    <Formik<Variables>
      initialValues={initialValues}
      onSubmit={(values, { setFieldError, setSubmitting }) => {
        const variables = { ...values, ...mutationArgs };
        update({ variables }).catch(() => {
          setFieldError(name, "Erreur serveur");
          setSubmitting(false);
        });
      }}
      validateOnChange={false}
      validationSchema={yupSchema}
    >
      {props => (
        <Form>
          <div className={styles.checkbox__row}>
            <Field
              className="td-checkbox"
              type="checkbox"
              name={name}
              disabled={!isEditing}
            />
            <label htmlFor={name}>{label}</label>
          </div>
          {loading && <div>Envoi en cours...</div>}

          <RedErrorMessage name={name}>{props.errors[name]}</RedErrorMessage>

          {isEditing && (
            <button
              className="btn btn--primary tw-mt-4"
              type="submit"
              disabled={props.isSubmitting}
            >
              Valider
            </button>
          )}
        </Form>
      )}
    </Formik>
  );
}
