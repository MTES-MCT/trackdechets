import React from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import gql from "graphql-tag";
import { useLocation, Link } from "react-router-dom";
import { useMutation, useQuery } from "@apollo/react-hooks";
import {
  Invitation,
  Mutation,
  MutationJoinWithInviteArgs,
  Query,
  User,
} from "../generated/graphql/types";
import Loader from "src/common/components/Loaders";
import { NotificationError } from "src/common/components/Error";

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
    <div className="container">
      <section className="section section-white">
        <h2>Confirmation de création de compte</h2>
        <p>
          Votre compte <span className="tw-font-bold">{user.email}</span> a bien
          été crée et vous êtes désormais membre des établissements suivants:
        </p>
        <ul>
          {user.companies?.map(company => (
            <li key={company.siret}>
              {company.name} - ({company.siret})
            </li>
          ))}
        </ul>
        <p>
          Connectez-vous à votre compte pour accéder à votre tableau de bord et
          accéder aux bordereaux de ces établissements.
        </p>
        <Link to="/login" className="btn btn--primary">
          Se connecter
        </Link>
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
    <div className="container">
      <section className="section section-white">
        <h2>Cette invitation n'est plus valide</h2>
        <p>
          Votre compte <span className="tw-font-bold">{email}</span> a déjà été
          crée et le rattachement à l'établissement dont le SIRET est{" "}
          <span className="tw-font-bold">{companySiret}</span> est effectif.
        </p>
        <p>
          Connectez-vous à votre compte pour accéder à votre tableau de bord et
          accéder aux bordereaux de cet établissement.
        </p>
        <Link to="/login" className="btn btn--primary">
          Se connecter
        </Link>
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
  const hash = decodeURIComponent(location.search.replace("?hash=", ""));

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
          passwordConfirmation: "",
        }}
        validate={values => {
          if (values.password !== values.passwordConfirmation) {
            return {
              passwordConfirmation:
                "Les deux mots de passe ne sont pas identiques.",
            };
          }
        }}
        onSubmit={(values, { setSubmitting }) => {
          const { name, password } = values;
          joinWithInvite({
            variables: { inviteHash: hash, name, password },
          }).then(_ => setSubmitting(false));
        }}
      >
        {({ isSubmitting }) => (
          <section className="section section-white">
            <div className="container">
              <Form>
                <h1>Validez votre inscription</h1>
                <p>
                  Vous avez été invité à rejoindre Trackdéchets. Pour valider
                  votre inscription, veuillez compléter le formulaire
                  ci-dessous.
                </p>
                <div className="form__group">
                  <label>
                    Email
                    <Field type="email" name="email" readOnly />
                  </label>
                </div>
                <div className="form__group">
                  <label>
                    Nom et prénom*
                    <Field type="text" name="name" />
                  </label>
                </div>

                <div className="form__group">
                  <label>
                    Mot de passe*
                    <Field type="password" name="password" />
                  </label>
                </div>

                <div className="form__group">
                  <label>
                    Vérification du mot de passe*
                    <Field type="password" name="passwordConfirmation" />
                  </label>
                </div>

                <ErrorMessage
                  name="passwordConfirmation"
                  render={msg => (
                    <div className="error-message">{msg}</div>
                  )}
                />
                <button
                  className="btn btn--primary"
                  type="submit"
                  disabled={isSubmitting}
                >
                  Valider l'inscription
                </button>
              </Form>
            </div>
          </section>
        )}
      </Formik>
    );
  }

  return null;
}
