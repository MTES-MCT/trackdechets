import React, { createRef, useEffect } from "react";
import * as queryString from "query-string";
import { useLocation, Redirect } from "react-router-dom";
import routes from "common/routes";

import {
  Container,
  Row,
  Col,
  Title,
  Text,
  Button,
  Link,
  Alert,
} from "@dataesr/react-dsfr";

import styles from "./Login.module.scss";

function getErrorMessage(errorCode: string) {
  if (errorCode === "INVALID_OR_MISSING_HASH") {
    return "Le lien est invalide, vous pouvez demander un nouvel email d'activation";
  }

  return "Invalide";
}

export default function UserActivation() {
  const location = useLocation<{
    errorCode?: string;
  }>();

  useEffect(() => {
    document.title = `Activation du compte | ${document.title}`;
  }, []);

  const queries = queryString.parse(location.search);

  const formRef = createRef<HTMLFormElement>();
  const { VITE_API_ENDPOINT } = import.meta.env;

  if (queries.errorCode) {
    const { errorCode } = queries;
    const state = {
      ...(queries.errorCode ? { errorCode } : {}),
    };

    return <Redirect to={{ pathname: routes.userActivation, state }} />;
  }

  const { errorCode } = location.state || {};

  const alert = errorCode ? (
    <Row spacing="mb-2w">
      <Alert
        title="Erreur"
        description={getErrorMessage(errorCode)}
        type="error"
      />
    </Row>
  ) : null;

  return (
    <div className={styles.onboardingWrapper}>
      <form
        ref={formRef}
        action={`${VITE_API_ENDPOINT}/userActivation`}
        method="post"
        name="userActivation"
      >
        <Container className={styles.centralContainer} spacing="pt-10w">
          {alert}
          <Row justifyContent="center" spacing="mb-2w">
            <Col spacing="m-auto">
              <Title as="h1" look="h3" spacing="mb-3w">
                Activation du compte utilisateur
              </Title>
              <p>
                Dernière étape, pour accéder à Trackdéchets, activez votre
                compte.
              </p>
              {queries?.hash && (
                <input type="hidden" name="hash" value={queries.hash} />
              )}
            </Col>
          </Row>
          <Row justifyContent="right">
            <Col>
              <Button size="md" submit={true}>
                Activer mon compte
              </Button>
            </Col>
          </Row>
          {errorCode && (
            <Row spacing="pt-3w">
              <Col>
                <Text as="p">
                  Vous n'avez pas encore de compte ?{" "}
                  <Link href={routes.signup.index} isSimple>
                    Inscrivez-vous
                  </Link>
                </Text>
                <Text as="p">
                  Vous n'avez pas reçu d'email d'activation suite à votre
                  inscription ?{" "}
                  <Link href={routes.resendActivationEmail} isSimple>
                    Renvoyer l'email d'activation
                  </Link>
                </Text>
              </Col>
            </Row>
          )}
        </Container>
      </form>
    </div>
  );
}
