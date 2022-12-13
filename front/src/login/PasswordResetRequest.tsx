import { useMutation, gql } from "@apollo/client";
import React, { useState, createRef } from "react";
import {
  Mutation,
  MutationCreatePasswordResetRequestArgs,
} from "generated/graphql/types";

import {
  Container,
  Row,
  Col,
  Title,
  Text,
  TextInput,
  Button,
  Alert,
} from "@dataesr/react-dsfr";
import styles from "./Login.module.scss";

const RESET_PASSWORD = gql`
  mutation CreatePasswordResetRequest($email: String!) {
    createPasswordResetRequest(email: $email)
  }
`;

export default function PasswordResetRequest() {
  const [submittable, setSubmittable] = useState(false);

  const [createPasswordResetRequest, { data, error }] =
    useMutation<
      Pick<Mutation, "createPasswordResetRequest">,
      MutationCreatePasswordResetRequestArgs
    >(RESET_PASSWORD);

  const emailRef = createRef<HTMLInputElement>();

  const handleSubmit = event => {
    event.preventDefault();

    const email = emailRef.current?.value || "";
    createPasswordResetRequest({ variables: { email } });
  };

  const onChange = () => {
    const formFilled = !!emailRef.current?.value;

    setSubmittable(formFilled);
  };

  const errorMessage = error?.networkError
    ? "Vous avez dépassé votre quota. Veuillez réessayer dans une minute."
    : error?.message;

  const errorAlert = error?.message ? (
    <Row spacing="mb-2w">
      <Alert title="Erreur" description={errorMessage} type="error" />
    </Row>
  ) : null;

  const successAlert = data ? (
    <Row spacing="mb-2w">
      <Alert
        title="Succès"
        description="Si l'adresse email existe dans notre système, vous allez recevoir un email (veuillez également vérifier dans votre dossier de courrier indésirable)."
        type="success"
      />
    </Row>
  ) : null;

  return (
    <div className={styles.onboardingWrapper}>
      <form onSubmit={handleSubmit}>
        <Container
          className={`pt-5w ${styles.centralContainerLarge}`}
          spacing="pt-10w"
        >
          {successAlert}
          {errorAlert}
          <Row justifyContent="center" spacing="mb-2w">
            <Col spacing="m-auto">
              <Title as="h1" look="h3" spacing="mb-3w">
                Réinitialisation de votre mot de passe
              </Title>
              <Text as="p">
                Afin de réinitialiser votre mot de passe, merci de saisir votre
                email. Un lien vous sera transmis à cette adresse email.
              </Text>
              <TextInput
                // @ts-ignore
                ref={emailRef}
                name="email"
                onChange={onChange}
                required
              />
            </Col>
          </Row>
          <Row justifyContent="right">
            <Col className={styles.resetFlexCol}>
              <Button disabled={!submittable} size="md" onClick={handleSubmit}>
                Réinitialiser
              </Button>
            </Col>
          </Row>
        </Container>
      </form>
    </div>
  );
}
