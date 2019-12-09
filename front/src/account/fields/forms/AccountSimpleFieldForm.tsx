import React from "react";
import { Formik, Form, Field, FormikProps } from "formik";
import { useMutation } from "@apollo/react-hooks";
import RedErrorMessage from "../../../common/RedErrorMessage";
import styles from "./AccountForm.module.scss";

type Props = {
  name: string;
  type: string;
  value: string | undefined;
  mutation: any;
  toggleEdition: () => void;
};

export default function AccountSimpleFieldForm<T>({
  name,
  type,
  value,
  mutation,
  toggleEdition
}: Props) {
  const [update, { loading }] = useMutation(mutation, {
    onCompleted: () => {
      toggleEdition();
    }
  });

  const initialValues = {} as T;
  initialValues[name] = value;

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={(values, { setFieldError, setSubmitting }) => {
        update({ variables: values }).catch(() => {
          setFieldError(name, "Erreur serveur");
          setSubmitting(false);
        });
      }}
      validateOnChange={false}
    >
      {(props: FormikProps<T>) => (
        <Form>
          <div className="form__group">
            <Field className={styles.input} type={type} name={name}></Field>
          </div>
          {loading && <div>Envoi en cours...</div>}

          {props.errors[name] && (
            <RedErrorMessage name="phone">{props.errors[name]}</RedErrorMessage>
          )}

          <button
            className="button"
            type="submit"
            disabled={props.isSubmitting}
          >
            Valider
          </button>
        </Form>
      )}
    </Formik>
  );
}
