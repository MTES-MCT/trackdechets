import React from "react";
import gql from "graphql-tag";
import { Formik, Form, Field, FormikProps } from "formik";
import { useMutation } from "@apollo/react-hooks";
import RedErrorMessage from "../../../common/RedErrorMessage";
import styles from "./AccountForm.module.scss";

type Props = {
  toggleEdition: () => void;
};

const CHANGE_PASSWORD = gql`
  mutation ChangePassword($oldPassword: String!, $newPassword: String!) {
    changePassword(oldPassword: $oldPassword, newPassword: $newPassword) {
      token
    }
  }
`;

type V = {
  oldPassword: string;
  newPassword: string;
  newPasswordConfirmation: string;
};

export default function AccountChangePasswordForm({ toggleEdition }: Props) {
  const [changePassword, { loading }] = useMutation(CHANGE_PASSWORD, {
    onCompleted: () => {
      toggleEdition();
    }
  });

  const validate = (values: V) => {
    if (values.newPassword !== values.newPasswordConfirmation) {
      return {
        newPasswordConfirmation:
          "Les deux mots de passe ne sont pas identiques."
      };
    }
  };

  const initialValues: V = {
    oldPassword: "",
    newPassword: "",
    newPasswordConfirmation: ""
  };

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={(values, { setFieldError, setSubmitting }) => {
        changePassword({ variables: values }).catch(() => {
          setSubmitting(false);
          setFieldError(
            "oldPassword",
            "Erreur. Vérifiez la saisie de votre ancien mot de passe."
          );
        });
      }}
      validateOnChange={false}
      validate={validate}
    >
      {(props: FormikProps<V>) => (
        <Form>
          <div className="form__group">
            <label htmlFor="oldPassword">Ancien mot de passe:</label>
            <Field
              id="oldPassword"
              className={styles.input}
              type="password"
              name="oldPassword"
            ></Field>
            {props.errors["oldPassword"] && (
              <RedErrorMessage name="oldPassword">
                {props.errors["oldPassword"]}
              </RedErrorMessage>
            )}
          </div>
          <div className="form__group">
            <label htmlFor="newPassword">Nouveau mot de passe:</label>
            <Field
              id="newPassword"
              className={styles.input}
              type="password"
              name="newPassword"
            ></Field>
          </div>
          <div className="form__group">
            <label htmlFor="newPasswordConfirmation">
              Confirmation du nouveau mot de passe:
            </label>
            <Field
              id="newPasswordConfirmation"
              className={styles.input}
              type="password"
              name="newPasswordConfirmation"
            ></Field>
            {props.errors["newPasswordConfirmation"] && (
              <RedErrorMessage name="newPasswordConfirmation">
                {props.errors["newPasswordConfirmation"]}
              </RedErrorMessage>
            )}
          </div>
          {loading && <div>Envoi en cours...</div>}

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
