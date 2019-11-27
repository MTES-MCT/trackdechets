import React from "react";
import gql from "graphql-tag";
import AccountField from "../AccountField";
import { Formik, Field, FormikProps } from "formik";
import { useMutation } from "@apollo/react-hooks";
import styles from "../AccountField.module.scss";

type Me = {
  email: string;
};

type Props = {
  me: Me;
};

AccountFieldEmail.fragments = {
  me: gql`
    fragment AccountFieldEmailFragment on User {
      id
      email
    }
  `
};

const UPDATE_EMAIL = gql`
  mutation UpdateEmail($email: String!) {
    editProfile(email: $email) {
      id
      email
    }
  }
`;

export default function AccountFieldEmail({ me }: Props) {
  const [updateEmail, { loading, error, data }] = useMutation(UPDATE_EMAIL);

  const validate = value => {};

  return (
    <AccountField
      render={(toggleEdition, { editing }) => (
        <>
          <label htmlFor="email">Email</label>
          <div id="email">
            {!editing ? (
              <span className={styles.value}>{me.email}</span>
            ) : (
              <Formik
                initialValues={{ email: me.email }}
                onSubmit={values => {
                  updateEmail({ variables: values });
                }}
              >
                {(props: FormikProps<Me>) => (
                  <form onSubmit={props.handleSubmit}>
                    <div className="form__group">
                      <Field
                        type="email"
                        name="email"
                        validate={validate}
                      ></Field>
                      {props.errors.email && <div>{props.errors.email}</div>}
                      <button className="button" type="submit">
                        Valider
                      </button>
                    </div>
                  </form>
                )}
              </Formik>
            )}
          </div>
          <div className={styles.modifier} onClick={toggleEdition}>
            {!editing ? "Modifier" : "Fermer"}
          </div>
        </>
      )}
    />
  );
}
