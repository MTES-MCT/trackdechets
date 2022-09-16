import { useMutation, gql } from "@apollo/client";
import React, { useState, createRef } from "react";
import {
  Mutation,
  MutationResendActivationEmailArgs,
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

const RESEND_ACTIVATION_EMAIL = gql`
  mutation ResendActivationEmail($email: String!) {
    resendActivationEmail(email: $email)
  }
`;

export default function ResendActivationEmail() {
  const [submittable, setSubmittable] = useState(false);

  const [resendActivationEmail, { data, error }] = useMutation<
    Pick<Mutation, "resendActivationEmail">,
    MutationResendActivationEmailArgs
  >(RESEND_ACTIVATION_EMAIL);

  const emailRef = createRef<HTMLInputElement>();

  const handleSubmit = event => {
    event.preventDefault();

    const email = emailRef.current?.value || "";
    resendActivationEmail({ variables: { email } });
  };

  const onChange = () => {
    const formFilled = !!emailRef.current?.value;

    setSubmittable(formFilled);
  };

  const errorAlert = error?.message ? (
    <Row spacing="mb-2w">
      <Alert title="Erreur" description={error.message} type="error" />
    </Row>
  ) : null;

  const successAlert = data ? (
    <Row spacing="mb-2w">
      <Alert
        title="Succès"
        description="Un email d'activation vous a été renvoyé."
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
                Renvoyer l'email d'activation
              </Title>
              <Text as="p">
                Si vous n'avez pas reçu d'email d'activation suite à votre
                inscription, vous pouvez en renvoyer un en renseignant votre
                adresse email ci-dessous :
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
                Renvoyer l'email
              </Button>
            </Col>
          </Row>
        </Container>
      </form>
    </div>
  );
}
