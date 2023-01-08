import { useMutation, gql } from "@apollo/client";
import React, { useState } from "react";
import {
  Mutation,
  MutationResendActivationEmailArgs,
} from "generated/graphql/types";
import Loader from "common/components/Loaders";
import { Captcha, useCaptcha } from "common/components/captcha";

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
  mutation ResendActivationEmail($input: ResendActivationEmailInput!) {
    resendActivationEmail(input: $input)
  }
`;

export default function ResendActivationEmail() {
  const [email, setEmail] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");

  const [resendActivationEmail, { data, error }] = useMutation<
    Pick<Mutation, "resendActivationEmail">,
    MutationResendActivationEmailArgs
  >(RESEND_ACTIVATION_EMAIL);
  const { captchaLoading, captchaError, captchaData, refetchCaptcha } =
    useCaptcha(true);

  const handleSubmit = event => {
    event.preventDefault();

    resendActivationEmail({
      variables: {
        input: {
          email,
          captcha: { token: captchaData?.token ?? "", value: captchaInput },
        },
      },
      onError: () => {
        setCaptchaInput("");
        refetchCaptcha();
      },
      onCompleted: () => {
        setCaptchaInput("");
        refetchCaptcha();
        setEmail("");
      },
    });
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
        description="Si votre compte est effectivement en attente sur notre plateforme, un email d'activation vous a été renvoyé."
        type="success"
      />
    </Row>
  ) : null;

  if (captchaLoading) {
    return <Loader />;
  }
  if (captchaError) {
    return (
      <Row spacing="mb-2w">
        <Alert
          title="Erreur"
          description="Une erreur est survenue, veuillez rafraîchir la page"
          type="error"
        />
      </Row>
    );
  }

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
                label="Email"
                name="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </Col>
          </Row>

          <Captcha
            setCaptchaInput={setCaptchaInput}
            captchaImg={captchaData?.img}
            captchaInput={captchaInput}
            captchaToken={captchaData?.token}
            refetch={refetchCaptcha}
          />

          <Row justifyContent="right">
            <Col className={styles.resetFlexCol}>
              <Button
                disabled={!email || !captchaInput}
                size="md"
                onClick={handleSubmit}
              >
                Renvoyer l'email
              </Button>
            </Col>
          </Row>
        </Container>
      </form>
    </div>
  );
}
