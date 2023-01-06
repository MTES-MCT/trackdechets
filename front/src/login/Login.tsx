import React, { useState, createRef, useEffect } from "react";
import * as queryString from "query-string";
import { useLocation, Redirect } from "react-router-dom";
import routes from "common/routes";
import { Captcha, useCaptcha } from "common/components/captcha";

import {
  Container,
  Row,
  Col,
  Title,
  Text,
  TextInput,
  Button,
  Link,
  Alert,
} from "@dataesr/react-dsfr";
import { Loader } from "common/components";

import styles from "./Login.module.scss";

function getErrorMessage(errorCode: string) {
  if (errorCode === "NOT_ACTIVATED") {
    return "Ce compte n'a pas encore été activé. Vérifiez vos emails ou contactez le support";
  }
  if (errorCode === "INVALID_USER_OR_PASSWORD_NEEDS_CAPTCHA") {
    return "Email ou mot de passe incorrect - Veuillez également compléter le test anti-robots";
  }
  if (errorCode === "INVALID_CAPTCHA") {
    return "Le test anti-robots est incorrect";
  }

  return "Email ou mot de passe incorrect";
}

function displayCaptcha(errorCode?: string) {
  if (!errorCode) {
    return false;
  }
  return ["INVALID_USER_OR_PASSWORD_NEEDS_CAPTCHA", "INVALID_CAPTCHA"].includes(
    errorCode
  );
}

export default function Login() {
  const location =
    useLocation<{
      errorCode?: string;
      returnTo?: string;
      username?: string;
    }>();

  useEffect(() => {
    document.title = `Créer un compte | ${document.title}`;
  }, []);

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");

  const queries = queryString.parse(location.search);

  // fill email field from passed state
  useEffect(() => {
    if (location.state?.username) {
      setEmail(location.state.username);
    }
  }, [setEmail, location]);

  const { captchaLoading, captchaError, captchaData } = useCaptcha(
    displayCaptcha(location?.state?.errorCode)
  );

  if (captchaError) {
    return <div>{captchaError}</div>;
  }
  if (captchaLoading) {
    return <Loader />;
  }

  const formRef = createRef<HTMLFormElement>();
  const { VITE_API_ENDPOINT } = import.meta.env;

  const createdWithSuccess = queries.signup === "complete";

  if (queries.errorCode || queries.returnTo) {
    const { errorCode, returnTo, username } = queries;
    const state = {
      ...(queries.errorCode ? { errorCode, username } : {}),
      ...(!!returnTo ? { returnTo } : {}),
    };

    return <Redirect to={{ pathname: routes.login, state }} />;
  }

  const { returnTo, errorCode, username } = location.state || {};

  const showCaptcha = displayCaptcha(errorCode);

  const alert = errorCode ? (
    <Row spacing="mb-2w">
      <Alert
        title="Erreur"
        description={getErrorMessage(errorCode)}
        type="error"
      />
    </Row>
  ) : null;

  const createdAlert = createdWithSuccess ? (
    <Row spacing="mb-2w">
      <Alert
        title="Votre compte est créé !"
        description="Vous pouvez maintenant vous connecter puis créer ou rejoindre un établissement."
        type="success"
      />
    </Row>
  ) : null;

  return (
    <div className={styles.onboardingWrapper}>
      <form
        ref={formRef}
        action={`${VITE_API_ENDPOINT}/login`}
        method="post"
        name="login"
      >
        <Container className={styles.centralContainer} spacing="pt-10w">
          {createdAlert}
          {alert}
          <Row justifyContent="center" spacing="mb-2w">
            <Col spacing="m-auto">
              <Title as="h1" look="h3" spacing="mb-3w">
                Se connecter
              </Title>

              <TextInput
                // @ts-ignore
                defaultValue={username}
                name="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                label="Email"
              />
              <TextInput
                type={showPassword ? "text" : "password"}
                // @ts-ignore
                name="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                label="Mot de passe"
              />
              {returnTo && (
                <input type="hidden" name="returnTo" value={returnTo} />
              )}
              <Button
                tertiary
                hasBorder={false}
                icon={showPassword ? "ri-eye-off-line" : "ri-eye-line"}
                iconPosition="left"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Masquer" : "Afficher"} le mot de passe
              </Button>
              {!!showCaptcha && !!captchaData?.token && !!captchaData?.img && (
                <>
                  <input
                    type="hidden"
                    value={captchaData.token}
                    name="captchaToken"
                  />

                  <Captcha
                    setCaptchaInput={setCaptchaInput}
                    captchaImg={captchaData.img}
                    captchaInput={captchaInput}
                  />
                </>
              )}
            </Col>
          </Row>
          <Row justifyContent="right">
            <Col className={styles.resetFlexCol}>
              <Button size="md" submit={true}>
                Se connecter
              </Button>
            </Col>
          </Row>
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
              <Text as="p">
                Vous avez perdu votre mot de passe ?{" "}
                <Link href={routes.passwordResetRequest} isSimple>
                  Réinitialisez-le
                </Link>
              </Text>
            </Col>
          </Row>
        </Container>
      </form>
    </div>
  );
}
