import React, { useState } from "react";
import { useMutation, useQuery, gql } from "@apollo/client";
import * as yup from "yup";
import * as queryString from "query-string";
import { useLocation, Link } from "react-router-dom";
import { decodeHash } from "common/helper";
import {
  Mutation,
  MutationUpdatePasswordArgs,
  Query,
} from "../generated/graphql/types";
import Loader from "common/components/Loaders";
import { NotificationError } from "common/components/Error";
import { Formik, Form, Field } from "formik";
import PasswordMeter from "common/components/PasswordMeter";
import RedErrorMessage from "common/components/RedErrorMessage";
import { IconLock1, IconView } from "common/components/Icons";
import routes from "common/routes";

const RESET_PASSWORD = gql`
  query ResetPassword($hash: String!) {
    resetPassword(hash: $hash)
  }
`;

const UPDATE_PASSWORD = gql`
  mutation UpdatePassword($hash: String!, $newPassword: String!) {
    updatePassword(hash: $hash, newPassword: $newPassword)
  }
`;

export default function ResetPasswordForm() {
  const [passwordType, setPasswordType] = useState("password");

  // parse qs and get rid of extra parameters
  const location = useLocation();
  const { hash: qsHash } = queryString.parse(location.search);
  const hash = decodeHash(qsHash);

  // CHECK RESET LINK QUERY
  const { loading, error: queryError, data: queryData } = useQuery<
    Pick<Query, "resetPassword">
  >(RESET_PASSWORD, {
    variables: { hash },
  });

  // UPDATE PASSWORD MUTATION
  const [
    updatePassword,
    { error: mutationError, data: mutationData },
  ] = useMutation<Pick<Mutation, "updatePassword">, MutationUpdatePasswordArgs>(
    UPDATE_PASSWORD
  );

  if (loading) {
    return <Loader />;
  }

  if (queryError) {
    return <NotificationError apolloError={queryError} />;
  }
  if (!queryData?.resetPassword) {
    return (
      <section className="section section-white">
        <div className="container-narrow">
          <h1 className="h1 tw-my-4">Lien invalide</h1>

          <p className="body-text">
            Vous avez suivi un lien invalide ou trop ancien.
          </p>
          <p className="body-text">
            Si vous souhaitez mettre à jour votre mot de passe, veuillez
            effectuer une nouvelle demande de réinitialisation.
          </p>
        </div>
      </section>
    );
  }
  if (mutationData) {
    return <PasswordChangedConfirmation />;
  }

  return (
    <Formik
      initialValues={{
        password: "",
      }}
      validationSchema={yup.object().shape({
        password: yup
          .string()
          .required("Le mot de passe est un champ requis")
          .min(8, "Le mot de passe doit faire au moins 8 caractères"),
      })}
      onSubmit={(values, { setSubmitting }) => {
        const { password } = values;
        updatePassword({ variables: { newPassword: password, hash } }).then(_ =>
          setSubmitting(false)
        );
      }}
    >
      {({ isSubmitting }) => (
        <section className="section section-white">
          <div className="container-narrow">
            <Form>
              <h1 className="h1 tw-my-4">Changement de mot de passe</h1>
              <p className="body-text">
                Veuiller entrer votre nouveau mot de apsse pour le mettre à
                jour.
              </p>
              <div>
                {!!mutationError && (
                  <NotificationError apolloError={mutationError} />
                )}
                <div className="form__row">
                  <label>Nouveau mot de passe</label>

                  <Field name="password">
                    {({ field }) => {
                      return (
                        <>
                          <div className="field-with-icon-wrapper">
                            <input
                              type={passwordType}
                              {...field}
                              className="td-input"
                            />
                            <i>
                              <IconLock1 />
                            </i>
                          </div>
                          <span
                            // className={styles.showPassword}
                            onClick={() =>
                              setPasswordType(
                                passwordType === "password"
                                  ? "text"
                                  : "password"
                              )
                            }
                          >
                            <IconView /> <span>Afficher le mot de passe</span>
                          </span>
                          <PasswordMeter password={field.value} />
                        </>
                      );
                    }}
                  </Field>

                  <RedErrorMessage name="password" />
                </div>
              </div>
              <div className="form__actions">
                <button
                  className="btn btn--primary"
                  type="submit"
                  disabled={isSubmitting}
                >
                  Je mets à jour mon mot de passe
                </button>
              </div>
            </Form>
          </div>
        </section>
      )}
    </Formik>
  );
}

function PasswordChangedConfirmation() {
  return (
    <div className="container-narrow">
      <section className="section section-white">
        <h2 className="h2 tw-my-4">Mot de passe mis à jour</h2>
        <p className="body-text">
          Votre mot de passe a été mis à jour avec succès.
        </p>

        <p className="body-text">
          Connectez-vous à votre compte pour accéder à votre tableau de bord et
          accéder aux bordereaux de ces établissements.
        </p>
        <div className="form__actions">
          <Link to={routes.login} className="btn btn--primary">
            Se connecter
          </Link>
        </div>
      </section>
    </div>
  );
}
