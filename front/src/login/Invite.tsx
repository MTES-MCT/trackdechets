import React, { useState } from "react";
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

import {
  Container,
  Row,
  Col,
  Title,
  Text,
  Alert,
  Button,
  TextInput,
} from "@dataesr/react-dsfr";
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
  const [showPassword, setShowPassword] = useState(false);
  // Extract invitation hash from URL
  const location = useLocation();
  const history = useHistory();

  // parse qs and get rid of extra parameters
  const parsedQs = queryString.parse(location.search);

  const { hash: qsHash } = parsedQs;

  const hash = decodeHash(qsHash);

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

  const pageContent = content => {
    return (
      <div className={styles.onboardingWrapper}>
        <Container className={styles.centralContainer} spacing="pt-10w">
          {content}
        </Container>
      </div>
    );
  };

  if (mutationError) {
    return pageContent(
      <Row justifyContent="center" spacing="mb-2w">
        <Alert
          title="Erreur"
          description={mutationError.message}
          type="error"
        />
      </Row>
    );
  }

  if (mutationData) {
    const user = mutationData.joinWithInvite;

    return pageContent(
      <>
        <Row justifyContent="center" spacing="mb-2w">
          <Col spacing="m-auto">
            <Title as="h2" look="h3" spacing="mb-1w">
              Confirmation de création de compte
            </Title>
            <Text as="p" spacing="mb-1w">
              Votre compte <strong>{user.email}</strong> a bien été crée et vous
              êtes désormais membre des établissements suivants:
            </Text>
            <ul className="bullets">
              {user.companies?.map(company => (
                <li key={company.siret}>
                  {company.name} - ({company.siret})
                </li>
              ))}
            </ul>
            <Text as="p" spacing="mb-1w">
              Connectez-vous à votre compte pour accéder à votre tableau de bord
              et accéder aux bordereaux de ces établissements.
            </Text>
          </Col>
        </Row>
        <Row justifyContent="right">
          <Col className={styles.resetFlexCol}>
            <Button
              size="md"
              onClick={() => {
                history.push({
                  pathname: routes.login,
                });
              }}
            >
              Se connecter
            </Button>
          </Col>
        </Row>
      </>
    );
  }

  if (queryError) {
    return pageContent(
      <Row justifyContent="center" spacing="mb-2w">
        <Alert title="Erreur" description={queryError.message} type="error" />
      </Row>
    );
  }

  if (queryData && queryData.invitation) {
    const { email, companySiret, acceptedAt } = queryData.invitation;

    if (acceptedAt) {
      return pageContent(
        <>
          <Row justifyContent="center" spacing="mb-2w">
            <Col spacing="m-auto">
              <Title as="h2" look="h3" spacing="mb-1w">
                Cette invitation n'est plus valide
              </Title>
              <Text as="p" spacing="mb-1w">
                Votre compte <strong>{email}</strong> a déjà été crée et le
                rattachement à l'établissement dont le SIRET est{" "}
                <strong>{companySiret}</strong> est effectif.
              </Text>
              <Text as="p" spacing="mb-1w">
                Connectez-vous à votre compte pour accéder à votre tableau de
                bord et accéder aux bordereaux de ces établissements.
              </Text>
            </Col>
          </Row>
          <Row justifyContent="right">
            <Col className={styles.resetFlexCol}>
              <Button
                size="md"
                onClick={() => {
                  history.push({
                    pathname: routes.login,
                  });
                }}
              >
                Se connecter
              </Button>
            </Col>
          </Row>
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
            <Row justifyContent="center" spacing="mb-2w">
              <Col spacing="m-auto">
                <Title as="h1" look="h3" spacing="mb-1w">
                  Validez votre inscription
                </Title>
                <Text as="p" spacing="mb-1w">
                  Vous avez été invité à rejoindre Trackdéchets. Pour valider
                  votre inscription, veuillez compléter le formulaire
                  ci-dessous.
                </Text>
                <Text as="p" className="fr-text--bold">
                  Vos informations :
                </Text>
                <Field name="name">
                  {({ field }) => {
                    return (
                      <TextInput
                        // @ts-ign
                        {...field}
                        required
                        label="Nom et prénom"
                        messageType={errors.name && touched.name ? "error" : ""}
                        message={errors.name && touched.name ? errors.name : ""}
                      />
                    );
                  }}
                </Field>
                <Field name="email">
                  {({ field }) => {
                    return (
                      <TextInput
                        // @ts-ignore
                        {...field}
                        readOnly
                        required
                        label="Email"
                      />
                    );
                  }}
                </Field>
                <Field name="password">
                  {({ field }) => {
                    return (
                      <TextInput
                        type={showPassword ? "text" : "password"}
                        {...field}
                        required
                        label="Mot de passe"
                        messageType={
                          errors.password && touched.password ? "error" : ""
                        }
                        message={
                          errors.password && touched.password
                            ? errors.password
                            : ""
                        }
                      />
                    );
                  }}
                </Field>
                <Button
                  tertiary
                  hasBorder={false}
                  icon={showPassword ? "ri-eye-off-line" : "ri-eye-line"}
                  iconPosition="left"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  Afficher le mot de passe
                </Button>
              </Col>
            </Row>
            <Row justifyContent="right">
              <Col className={styles.resetFlexCol}>
                <Button
                  icon="ri-arrow-right-line"
                  iconPosition="right"
                  size="md"
                  onClick={submitForm}
                  disabled={!isValid}
                  title={
                    isSubmitting ? "Création en cours..." : "Créer mon compte"
                  }
                >
                  Créer mon compte
                </Button>
              </Col>
            </Row>
          </Form>
        )}
      </Formik>
    );
  }

  return null;
}
