import { useMutation, gql } from "@apollo/client";
import React, { useState } from "react";
import {
  Mutation,
  MutationCreatePasswordResetRequestArgs,
} from "generated/graphql/types";
import Loader from "common/components/Loaders";
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
import { Captcha, useCaptcha } from "common/components/captcha";

import styles from "./Login.module.scss";

const RESET_PASSWORD = gql`
  mutation CreatePasswordResetRequest(
    $input: CreatePasswordResetRequestInput!
  ) {
    createPasswordResetRequest(input: $input)
  }
`;

export default function PasswordResetRequest() {
  const [email, setEmail] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [createPasswordResetRequest, { data, error }] =
    useMutation<
      Pick<Mutation, "createPasswordResetRequest">,
      MutationCreatePasswordResetRequestArgs
    >(RESET_PASSWORD);
  const { captchaLoading, captchaError, captchaData, refetchCaptcha } =
    useCaptcha(true);

  const handleSubmit = event => {
    event.preventDefault();

    createPasswordResetRequest({
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

  const errorMessage = error?.networkError
    ? "Vous avez dépassé votre quota. Veuillez réessayer dans quelques minutes."
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
                Réinitialisation de votre mot de passe
              </Title>
              <Text as="p">
                Afin de réinitialiser votre mot de passe, merci de saisir votre
                email. Un lien vous sera transmis à cette adresse email.
              </Text>
              <TextInput
                // @ts-ignore
                name="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </Col>
          </Row>
          <Captcha
            setCaptchaInput={setCaptchaInput}
            captchaImg={captchaData?.img}
            captchaInput={captchaInput}
          />
          <Row justifyContent="right">
            <Col className={styles.resetFlexCol}>
              <Button
                disabled={!email || !captchaInput}
                size="md"
                onClick={handleSubmit}
              >
                Réinitialiser
              </Button>
            </Col>
          </Row>
        </Container>
      </form>
    </div>
  );
}
