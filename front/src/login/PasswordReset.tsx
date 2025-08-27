import React from "react";
import { useMutation, useQuery, gql } from "@apollo/client";
import * as yup from "yup";
import * as queryString from "query-string";
import { useLocation, Link } from "react-router-dom";
import { decodeHash } from "../common/helper";
import { Mutation, MutationResetPasswordArgs, Query } from "@td/codegen-ui";
import Loader from "../Apps/common/Components/Loader/Loaders";
import { NotificationError } from "../Apps/common/Components/Error/Error";
import { Formik, Form, Field } from "formik";
import RedErrorMessage from "../common/components/RedErrorMessage";
import routes from "../Apps/routes";
import PasswordInput from "@codegouvfr/react-dsfr/blocks/PasswordInput";
import {
  getPasswordHint,
  PasswordHintResult,
  MIN_LENGTH
} from "../common/components/PasswordHelper";
import Button from "@codegouvfr/react-dsfr/Button";
import { useState, useEffect } from "react";

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

// Separate component to handle password validation with hooks
const PasswordField = ({ password }: { password: string }) => {
  const [passwordHint, setPasswordHint] = useState<PasswordHintResult | null>(
    null
  );

  useEffect(() => {
    if (password) {
      getPasswordHint(password).then(hint => {
        setPasswordHint(hint);
      });
    } else {
      setPasswordHint(null);
    }
  }, [password]);

  return (
    <Field name="password">
      {({ field }) => {
        return (
          <PasswordInput
            nativeInputProps={{ ...field }}
            label="Mot de passe"
            className="fr-mb-2w"
            messages={[
              {
                message: `contenir ${MIN_LENGTH} caractères minimum`,
                severity: !password
                  ? "info"
                  : password.length < MIN_LENGTH
                  ? "error"
                  : "valid"
              },
              {
                message:
                  "avoir une complexité suffisante. Nous vous recommandons d'utiliser une phrase de passe (plusieurs mots accolés) ou un gestionnaire de mots de passe",
                severity: !password
                  ? "info"
                  : passwordHint?.hintType === "success"
                  ? "valid"
                  : "error"
              }
            ]}
          />
        );
      }}
    </Field>
  );
};

export default function PasswordReset() {
  // parse qs and get rid of extra parameters
  const location = useLocation();
  const { hash: qsHash } = queryString.parse(location.search);
  const hash = decodeHash(qsHash);

  // CHECK RESET LINK QUERY
  const {
    loading,
    error: queryError,
    data: queryData
  } = useQuery<Pick<Query, "passwordResetRequest">>(PASSWORD_RESET_REQUEST, {
    variables: { hash }
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
        password: ""
      }}
      validationSchema={yup.object().shape({
        password: yup
          .string()
          .required("Le mot de passe est un champ requis")
          .min(10, "Le mot de passe doit faire au moins 10 caractères")
          .max(64, "Le mot de passe doit faire au maximum 64 caractères")
      })}
      onSubmit={(values, { setSubmitting }) => {
        const { password } = values;
        resetPassword({ variables: { newPassword: password, hash } })
          .then(_ => setSubmitting(false))
          .catch(_ => setSubmitting(false));
      }}
    >
      {({ isSubmitting, values }) => {
        return (
          <section className="section section-white">
            <div className="container-narrow">
              <Form>
                <h3 className="fr-h3 fr-mb-2w">Modifier le mot de passe</h3>
                <p className="fr-text fr-mb-4w">
                  Veuillez entrer votre nouveau mot de passe pour le mettre à
                  jour.
                </p>
                <div>
                  {!!mutationError && (
                    <NotificationError apolloError={mutationError} />
                  )}
                  <div className="form__row">
                    <PasswordField password={values.password} />
                    <RedErrorMessage name="password" />
                  </div>
                </div>
                <Button
                  priority="primary"
                  disabled={isSubmitting}
                  className="fr-mt-4w"
                >
                  Modifier
                </Button>
              </Form>
            </div>
          </section>
        );
      }}
    </Formik>
  );
}

const PasswordChangedSuccess = () => (
  <div className="container-narrow">
    <section className="section section-white">
      <h3 className="fr-h3 fr-mb-4w">Mot de passe modifié</h3>
      <p className="fr-text fr-mb-4w">
        Votre mot de passe a été mis à jour avec succès.
      </p>

      <p className="fr-text">
        Connectez-vous à votre compte pour accéder à votre tableau de bord et
        accéder aux bordereaux de ces établissements.
      </p>
      <div className="fr-mt-4w">
        <Link to={routes.login} className="fr-btn fr-btn--primary">
          Se connecter
        </Link>
      </div>
    </section>
  </div>
);
