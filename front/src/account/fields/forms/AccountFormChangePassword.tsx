import React from "react";
import gql from "graphql-tag";
import { Formik, Form, Field } from "formik";
import { useMutation } from "@apollo/react-hooks";
import RedErrorMessage from "src/common/components/RedErrorMessage";
import PasswordMeter from "src/common/components/PasswordMeter";
import styles from "./AccountForm.module.scss";
import { object, string } from "yup";
import {
  MutationChangePasswordArgs,
  Mutation,
} from "src/generated/graphql/types";

type Props = {
  toggleEdition: () => void;
};

const CHANGE_PASSWORD = gql`
  mutation ChangePassword($oldPassword: String!, $newPassword: String!) {
    changePassword(oldPassword: $oldPassword, newPassword: $newPassword) {
      id
    }
  }
`;

type V = MutationChangePasswordArgs & {
  newPasswordConfirmation: string;
};

export default function AccountFormChangePassword({ toggleEdition }: Props) {
  const [changePassword, { loading }] = useMutation<
    Pick<Mutation, "changePassword">,
    MutationChangePasswordArgs
  >(CHANGE_PASSWORD, {
    onCompleted: () => {
      toggleEdition();
    },
  });

  const validate = (values: V) => {
    if (values.newPassword !== values.newPasswordConfirmation) {
      return {
        newPasswordConfirmation:
          "Les deux mots de passe ne sont pas identiques.",
      };
    }
  };

  const yupSchema = object().shape({
    oldPassword: string().required(),
    newPassword: string().required(),
    newPasswordConfirmation: string().required(),
  });

  const initialValues: V = {
    oldPassword: "",
    newPassword: "",
    newPasswordConfirmation: "",
  };

  return (
    <Formik<V>
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
      validationSchema={yupSchema}
    >
      {props => (
        <Form>
          <div className="form__row">
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
          <div className="form__row">
            <label htmlFor="newPassword">Nouveau mot de passe:</label>
            <Field
              id="newPassword"
              className={styles.input}
              type="password"
              name="newPassword"
            ></Field>
            <PasswordMeter password={props.values.newPassword} />
          </div>
          <div className="form__row">
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
            className="btn btn--primary"
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
