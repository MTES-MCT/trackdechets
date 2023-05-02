import React from "react";
import { useLocation, useHistory } from "react-router-dom";
import { useMutation, useQuery, gql } from "@apollo/client";
import { Formik, Form, Field } from "formik";
import * as yup from "yup";
import {
  Mutation,
  MutationJoinWithInviteArgs,
  Query,
} from "../generated/graphql/types";
import Loader from "common/components/Loaders";
import * as queryString from "query-string";
import { decodeHash } from "common/helper";
import routes from "common/routes";

import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { PasswordInput } from "@codegouvfr/react-dsfr/blocks/PasswordInput";
import styles from "./Login.module.scss";

const INVITATION = gql`
  query Invitation($hash: String!) {
    invitation(hash: $hash) {
      email
      acceptedAt
      companySiret
    }
  }
`;

const JOIN_WITH_INVITE = gql`
  mutation JoinWithInvite(
    $inviteHash: String!
    $name: String!
    $password: String!
  ) {
    joinWithInvite(inviteHash: $inviteHash, name: $name, password: $password) {
      id
      email
      companies {
        name
        siret
      }
    }
  }
`;

export default function Invite() {
  // Extract invitation hash from URL
  const location = useLocation();
  const history = useHistory();

  // parse qs and get rid of extra parameters
  const parsedQs = queryString.parse(location.search);

  const { hash: qsHash } = parsedQs;

  const hash = decodeHash(qsHash);

  // INVITATION QUERY
  const {
    loading,
    error: queryError,
    data: queryData,
  } = useQuery<Pick<Query, "invitation">>(INVITATION, {
    variables: { hash },
  });

  // JOIN_WITH_INVITE MUTATION
  const [joinWithInvite, { error: mutationError, data: mutationData }] =
    useMutation<Pick<Mutation, "joinWithInvite">, MutationJoinWithInviteArgs>(
      JOIN_WITH_INVITE
    );

  if (loading) {
    return <Loader />;
  }

  const pageContent = content => {
    return (
      <div className={styles.onboardingWrapper}>
        <div className={`fr-container fr-pt-10w ${styles.centralContainer}`}>
          {content}
        </div>
      </div>
    );
  };

  if (mutationError) {
    return pageContent(
      <div className="fr-grid-row fr-grid-row--center fr-mb-2w">
        <Alert
          title="Erreur"
          description={mutationError.message}
          severity="error"
        />
      </div>
    );
  }

  if (mutationData) {
    const user = mutationData.joinWithInvite;

    return pageContent(
      <>
        <div className="fr-grid-row fr-grid-row--center fr-mb-2w">
          <div className="fr-col fr-m-auto">
            <h2 className="fr-h3 fr-mb-1w">
              Confirmation de création de compte
            </h2>
            <p className="fr-text--md fr-mb-1w">
              Votre compte <strong>{user.email}</strong> a bien été crée et vous
              êtes désormais membre des établissements suivants:
            </p>
            <ul className="bullets">
              {user.companies?.map(company => (
                <li key={company.orgId}>
                  {company.name} - ({company.orgId})
                </li>
              ))}
            </ul>
            <p className="fr-text--md fr-mb-1w">
              Connectez-vous à votre compte pour accéder à votre tableau de bord
              et accéder aux bordereaux de ces établissements.
            </p>
          </div>
        </div>
        <div className="fr-grid-row fr-grid-row--right">
          <div className={`fr-col ${styles.resetFlexCol}`}>
            <Button
              size="medium"
              onClick={() => {
                history.push({
                  pathname: routes.login,
                });
              }}
            >
              Se connecter
            </Button>
          </div>
        </div>
      </>
    );
  }

  if (queryError) {
    return pageContent(
      <div className="fr-grid-row fr-grid-row--center mb-2w">
        <Alert
          title="Erreur"
          description={queryError.message}
          severity="error"
        />
      </div>
    );
  }

  if (queryData && queryData.invitation) {
    const { email, companySiret, acceptedAt } = queryData.invitation;

    if (acceptedAt) {
      return pageContent(
        <>
          <div className="fr-grid-row fr-grid-row--center mb-2w">
            <div className="fr-col fr-m-auto">
              <h2 className="fr-h3 fr-mb-1w">
                Cette invitation n'est plus valide
              </h2>
              <p className="fr-text--md fr-mb-1w">
                Votre compte <strong>{email}</strong> a déjà été crée et le
                rattachement à l'établissement dont le SIRET est{" "}
                <strong>{companySiret}</strong> est effectif.
              </p>
              <p className="fr-text--md fr-mb-1w">
                Connectez-vous à votre compte pour accéder à votre tableau de
                bord et accéder aux bordereaux de ces établissements.
              </p>
            </div>
          </div>
          <div className="fr-grid-row fr-grid-row--right">
            <div className={`fr-col ${styles.resetFlexCol}`}>
              <Button
                size="medium"
                onClick={() => {
                  history.push({
                    pathname: routes.login,
                  });
                }}
              >
                Se connecter
              </Button>
            </div>
          </div>
        </>
      );
    }

    return pageContent(
      <Formik
        initialValues={{
          email: email ?? "",
          name: "",
          password: "",
        }}
        validationSchema={yup.object().shape({
          email: yup.string().email().required("L'email est un champ requis"),
          name: yup.string().required("Le nom est un champ requis"),
          password: yup
            .string()
            .required("Le mot de passe est un champ requis")
            .min(8, "Le mot de passe doit faire au moins 8 caractères"),
        })}
        onSubmit={(values, { setSubmitting }) => {
          const { name, password } = values;
          joinWithInvite({
            variables: { inviteHash: hash, name, password },
          }).then(_ => setSubmitting(false));
        }}
      >
        {({ isSubmitting, errors, touched, isValid, submitForm }) => (
          <Form>
            <div className="fr-grid-row fr-grid-row--center fr-mb-2w">
              <div className="fr-col fr-m-auto">
                <h1 className="fr-h3 fr-mb-1w">Validez votre inscription</h1>
                <p className="fr-text--md fr-mb-1w">
                  Vous avez été invité à rejoindre Trackdéchets. Pour valider
                  votre inscription, veuillez compléter le formulaire
                  ci-dessous.
                </p>
                <p className="fr-text--bold">Vos informations :</p>
                <Field name="name">
                  {({ field }) => {
                    return (
                      <Input
                        label="Nom et prénom"
                        state={
                          errors.name && touched.name ? "error" : "default"
                        }
                        stateRelatedMessage={
                          errors.name && touched.name ? errors.name : ""
                        }
                        nativeInputProps={{
                          required: true,
                          ...field,
                        }}
                      />
                    );
                  }}
                </Field>
                <Field name="email">
                  {({ field }) => {
                    return (
                      <Input
                        label="Email"
                        nativeInputProps={{
                          required: true,
                          readOnly: true,
                          ...field,
                        }}
                      />
                    );
                  }}
                </Field>
                <Field name="password">
                  {({ field }) => {
                    return (
                      <PasswordInput
                        label="Mot de passe"
                        messages={[
                          {
                            severity: "info",
                            message: "8 caractères minimum",
                          },
                          {
                            severity:
                              errors.password && touched.password
                                ? "error"
                                : "info",
                            message:
                              errors.password && touched.password
                                ? errors.password
                                : "",
                          },
                        ]}
                        nativeInputProps={{ required: true, ...field }}
                      />
                    );
                  }}
                </Field>
              </div>
            </div>
            <div className="fr-grid-row fr-grid-row--right">
              <div className={`fr-col ${styles.resetFlexCol}`}>
                <Button
                  iconId="ri-arrow-right-line"
                  iconPosition="right"
                  size="medium"
                  onClick={submitForm}
                  disabled={!isValid}
                  title={
                    isSubmitting ? "Création en cours..." : "Créer mon compte"
                  }
                >
                  Créer mon compte
                </Button>
              </div>
            </div>
          </Form>
        )}
      </Formik>
    );
  }

  return null;
}
