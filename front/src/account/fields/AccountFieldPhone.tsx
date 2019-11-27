import React from "react";
import gql from "graphql-tag";
import RedErrorMessage from "../../common/RedErrorMessage";
import { Formik, Field, FormikProps } from "formik";
import { useMutation } from "@apollo/react-hooks";
import AccountField from "../AccountField";
import styles from "../AccountField.module.scss";

type Me = {
  phone: string;
};

type Props = {
  me: Me;
};

AccountFieldPhone.fragments = {
  me: gql`
    fragment AccountFieldPhoneFragment on User {
      id
      phone
    }
  `
};

const UPDATE_PHONE = gql`
  mutation UpdatePhone($phone: String!) {
    editProfile(phone: $phone) {
      id
      phone
    }
  }
`;

export default function AccountFieldPhone({ me }: Props) {
  const [updatePhone, { loading, error }] = useMutation(UPDATE_PHONE);

  const validate = value => {
    // TODO perform validation
  };

  return (
    <AccountField
      render={(toggleEdition, { editing }) => (
        <>
          <label htmlFor="phone">Téléphone</label>
          <div id="phone">
            {!editing ? (
              <span>{me.phone}</span>
            ) : (
              <Formik
                initialValues={{ phone: me.phone }}
                onSubmit={values => {
                  updatePhone({ variables: values }).then(() => {
                    toggleEdition();
                  });
                }}
                validateOnChange={false}
              >
                {(props: FormikProps<Me>) => (
                  <form onSubmit={props.handleSubmit}>
                    <div className="form__group">
                      <Field
                        type="tel"
                        name="phone"
                        validate={validate}
                      ></Field>
                      {loading && <div>Envoi en cours...</div>}

                      {props.errors.phone && (
                        <RedErrorMessage name="phone">
                          {props.errors.phone}
                        </RedErrorMessage>
                      )}

                      {error && (
                        <div className="input-error-message">
                          Erreur serveur
                        </div>
                      )}
                      <button
                        className="button"
                        type="submit"
                        disabled={props.isSubmitting}
                      >
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
