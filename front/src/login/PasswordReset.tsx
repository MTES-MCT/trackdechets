import React, { useState } from "react";
import { useMutation, useQuery, gql } from "@apollo/client";
import * as yup from "yup";
import * as queryString from "query-string";
import { useLocation, Link } from "react-router-dom";
import { decodeHash } from "common/helper";
import {
  Mutation,
  MutationResetPasswordArgs,
  Query,
} from "../generated/graphql/types";
import Loader from "Apps/common/Components/Loader/Loaders";
import { NotificationError } from "Apps/common/Components/Error/Error";
import { Formik, Form, Field } from "formik";
import PasswordHelper from "common/components/PasswordHelper";
import RedErrorMessage from "common/components/RedErrorMessage";
import { IconLock1, IconView } from "Apps/common/Components/Icons/Icons";
import routes from "Apps/routes";

const PASSWORD_RESET_REQUEST = gql`
  query PasswordResetRequest($hash: String!) {
    passwordResetRequest(hash: $hash)
  }
`;

const RESET_PASSWORD = gql`
  mutation ResetPassword($hash: String!, $newPassword: String!) {
    resetPassword(hash: $hash, newPassword: $newPassword)
  }
`;

export default function PasswordReset() {
  const [passwordType, setPasswordType] = useState("password");

  // parse qs and get rid of extra parameters
  const location = useLocation();
  const { hash: qsHash } = queryString.parse(location.search);
  const hash = decodeHash(qsHash);

  // CHECK RESET LINK QUERY
  const {
    loading,
    error: queryError,
    data: queryData,
  } = useQuery<Pick<Query, "passwordResetRequest">>(PASSWORD_RESET_REQUEST, {
    variables: { hash },
  });

  // UPDATE PASSWORD MUTATION
  const [resetPassword, { error: mutationError, data: mutationData }] =
    useMutation<Pick<Mutation, "resetPassword">, MutationResetPasswordArgs>(
      RESET_PASSWORD
    );

  if (loading) {
    return <Loader />;
  }

  if (queryError) {
    return <NotificationError apolloError={queryError} />;
  }

  if (!queryData?.passwordResetRequest) {
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
    return <PasswordChangedSuccess />;
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
          .min(10, "Le mot de passe doit faire au moins 10 caractères")
          .max(64, "Le mot de passe doit faire au maximum 64 caractères"),
      })}
      onSubmit={(values, { setSubmitting }) => {
        const { password } = values;
        resetPassword({ variables: { newPassword: password, hash } })
          .then(_ => setSubmitting(false))
          .catch(_ => setSubmitting(false));
      }}
    >
      {({ isSubmitting }) => (
        <section className="section section-white">
          <div className="container-narrow">
            <Form>
              <h1 className="h1 tw-my-4">Changement de mot de passe</h1>
              <p className="body-text">
                Veuillez entrer votre nouveau mot de passe pour le mettre à
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
                            className="showPassword"
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
                          <PasswordHelper password={field.value} />
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
                  Mettre à jour mon mot de passe
                </button>
              </div>
            </Form>
          </div>
        </section>
      )}
    </Formik>
  );
}

const PasswordChangedSuccess = () => (
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
