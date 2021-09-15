import React, { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as yup from "yup";
import { useLocation, Link } from "react-router-dom";
import { useMutation, useQuery, gql } from "@apollo/client";
import {
  Invitation,
  Mutation,
  MutationJoinWithInviteArgs,
  Query,
  User,
} from "../generated/graphql/types";
import {
  IconEmailActionUnread,
  IconLock1,
  IconView,
  IconSingleNeutralIdCard4,
} from "common/components/Icons";
import Loader from "common/components/Loaders";
import { NotificationError } from "common/components/Error";
import routes from "common/routes";
import PasswordMeter from "common/components/PasswordMeter";
import RedErrorMessage from "common/components/RedErrorMessage";
import styles from "./Invite.module.scss";
import querystring from "querystring";
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

/**
 * This page is shown on successful signup
 * The user get a list of all the companies he is part of
 */
function SignupConfirmation({ user }: { user: User }) {
  return (
    <div className="container-narrow">
      <section className="section section-white">
        <h2 className="h2 tw-my-4">Confirmation de création de compte</h2>
        <p className="body-text">
          Votre compte <span className="tw-font-bold">{user.email}</span> a bien
          été crée et vous êtes désormais membre des établissements suivants:
        </p>
        <ul className="bullets">
          {user.companies?.map(company => (
            <li key={company.siret}>
              {company.name} - ({company.siret})
            </li>
          ))}
        </ul>
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

/**
 * This page is shown when user try to join several times with the
 * same invite link
 */
function AlreadyAccepted({ invitation }: { invitation: Invitation }) {
  const { email, companySiret } = invitation;
  return (
    <div className="container-narrow">
      <section className="section section-white">
        <h2 className="h2 tw-my-4">Cette invitation n'est plus valide</h2>
        <p className="body-text">
          Votre compte <span className="tw-font-bold">{email}</span> a déjà été
          crée et le rattachement à l'établissement dont le SIRET est{" "}
          <span className="tw-font-bold">{companySiret}</span> est effectif.
        </p>
        <p className="body-text">
          Connectez-vous à votre compte pour accéder à votre tableau de bord et
          accéder aux bordereaux de cet établissement.
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

/**
 * Signup to Trackdéchets with an invitation link
 */
export default function Invite() {
  // Extract invitation hash from URL
  const location = useLocation();

  // parse qs and get rid of extra parameters
  const parsedQs = querystring.parse(location.search);
  const { hash: qsHash } = parsedQs;

  const hash = Array.isArray(qsHash)
    ? decodeURIComponent(qsHash[0])
    : decodeURIComponent(qsHash);

  const [passwordType, setPasswordType] = useState("password");

  // INVITATION QUERY
  const { loading, error: queryError, data: queryData } = useQuery<
    Pick<Query, "invitation">
  >(INVITATION, {
    variables: { hash },
  });

  // JOIN_WITH_INVITE MUTATION
  const [
    joinWithInvite,
    { error: mutationError, data: mutationData },
  ] = useMutation<Pick<Mutation, "joinWithInvite">, MutationJoinWithInviteArgs>(
    JOIN_WITH_INVITE
  );

  if (loading) {
    return <Loader />;
  }

  if (mutationError) {
    return <NotificationError apolloError={mutationError} />;
  }

  if (mutationData) {
    const user = mutationData.joinWithInvite;
    return <SignupConfirmation user={user} />;
  }

  if (queryError) {
    return <NotificationError apolloError={queryError} />;
  }

  if (queryData && queryData.invitation) {
    const invitation = queryData.invitation;

    // invitation was already accepted
    if (invitation.acceptedAt) {
      return <AlreadyAccepted invitation={invitation} />;
    }

    return (
      <Formik
        initialValues={{
          email: invitation?.email ?? "",
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
        {({ isSubmitting }) => (
          <section className="section section-white">
            <div className="container-narrow">
              <Form>
                <h1 className="h1 tw-my-4">Validez votre inscription</h1>
                <p className="body-text">
                  Vous avez été invité à rejoindre Trackdéchets. Pour valider
                  votre inscription, veuillez compléter le formulaire
                  ci-dessous.
                </p>

                <div className="form__row">
                  <label>Email</label>
                  <div className="field-with-icon-wrapper">
                    <Field
                      type="email"
                      name="email"
                      className="td-input"
                      readOnly
                    />
                    <i>
                      <IconEmailActionUnread />
                    </i>
                  </div>
                  <RedErrorMessage name="email" />
                </div>

                <div className="form__row">
                  <label>Nom et prénom</label>
                  <div className="field-with-icon-wrapper">
                    <Field type="text" name="name" className="td-input" />
                    <i>
                      <IconSingleNeutralIdCard4 />
                    </i>
                  </div>

                  <RedErrorMessage name="name" />
                </div>

                <div className="form__row">
                  <label>Mot de passe</label>

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
                            className={styles.showPassword}
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

                <ErrorMessage
                  name="passwordConfirmation"
                  render={msg => <div className="error-message">{msg}</div>}
                />
                <div className="form__actions">
                  <button
                    className="btn btn--primary"
                    type="submit"
                    disabled={isSubmitting}
                  >
                    Valider l'inscription
                  </button>
                </div>
              </Form>
            </div>
          </section>
        )}
      </Formik>
    );
  }

  return null;
}
