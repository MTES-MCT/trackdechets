import React from "react";
import { Formik, Field, FormikProps } from "formik";
import { MutationTuple } from "@apollo/react-hooks";
import RedErrorMessage from "../../../common/RedErrorMessage";
import styles from "./AccountSimpleFieldForm.module.scss";

type Props = {
  name: string;
  type: string;
  value: string | undefined;
  mutationTuple: MutationTuple<any, any>;
  toggleEdition: () => void;
};

export default function AccountSimpleFieldForm<T>({
  name,
  type,
  value,
  mutationTuple,
  toggleEdition
}: Props) {
  const [update, { loading, error }] = mutationTuple;

  const validate = () => {};

  const initialValues = {} as T;
  initialValues[name] = value;

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={values => {
        update({ variables: values }).then(() => {
          toggleEdition();
        });
      }}
      validateOnChange={false}
    >
      {(props: FormikProps<T>) => (
        <form onSubmit={props.handleSubmit}>
          <div className="form__group">
            <Field type={type} name={name} validate={validate}></Field>
            {loading && <div>Envoi en cours...</div>}

            {props.errors[name] && (
              <RedErrorMessage name="phone">
                {props.errors[name]}
              </RedErrorMessage>
            )}

            {error && <div className="input-error-message">Erreur serveur</div>}
            <button
              className="button"
              type="submit"
              disabled={props.isSubmitting}
            >
              Valider
            </button>
            <div className={styles.cancel} onClick={toggleEdition}>
              Annuler
            </div>
          </div>
        </form>
      )}
    </Formik>
  );
}
