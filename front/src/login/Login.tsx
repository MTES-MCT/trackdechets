import React, { useState, createRef, useEffect } from "react";
import * as queryString from "query-string";
import { useLocation, Redirect } from "react-router-dom";
import routes from "common/routes";
import { Captcha, useCaptcha } from "common/components/captcha";

import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { PasswordInput } from "@codegouvfr/react-dsfr/blocks/PasswordInput";
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
  const location = useLocation<{
    errorCode?: string;
    returnTo?: string;
    username?: string;
  }>();

  useEffect(() => {
    document.title = `Se connecter | ${document.title}`;
  }, []);

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

  const { captchaLoading, captchaError, captchaData, refetchCaptcha } =
    useCaptcha(displayCaptcha(location?.state?.errorCode));

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
    <div className="fr-grid-row fr-mb-2w">
      <Alert
        title="Erreur"
        description={getErrorMessage(errorCode)}
        severity="error"
      />
    </div>
  ) : null;

  const createdAlert = createdWithSuccess ? (
    <div className="fr-grid-row fr-mb-2w">
      <Alert
        title="Votre compte est créé !"
        description="Vous pouvez maintenant vous connecter puis créer ou rejoindre un établissement."
        severity="success"
      />
    </div>
  ) : null;

  return (
    <div className={styles.onboardingWrapper}>
      <form
        ref={formRef}
        action={`${VITE_API_ENDPOINT}/login`}
        method="post"
        name="login"
      >
        <div className={`fr-container fr-pt-10w ${styles.centralContainer}`}>
          {createdAlert}
          {alert}
          <div className="fr-grid-row fr-grid-row--center fr-mb-2w">
            <div className="fr-col fr-m-auto">
              <h1 className="fr-h3 fr-mb-3w">Se connecter</h1>

              <Input
                nativeInputProps={{
                  value: email || username,
                  name: "email",
                  required: true,
                  onChange: e => setEmail(e.target.value),
                }}
                label="Email"
              />
              <PasswordInput
                nativeInputProps={{
                  name: "password",
                  value: password,
                  required: true,
                  onChange: e => setPassword(e.target.value),
                }}
                label="Mot de passe"
              />
              {returnTo && (
                <input type="hidden" name="returnTo" value={returnTo} />
              )}
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
                    captchaToken={captchaData.token}
                    refetch={refetchCaptcha}
                    narrow={true}
                  />
                </>
              )}
            </div>
          </div>
          <div className="fr-grid-row fr-grid-row--right">
            <div className={`fr-col ${styles.resetFlexCol}`}>
              <Button size="medium" nativeButtonProps={{ type: "submit" }}>
                Se connecter
              </Button>
            </div>
          </div>
          <div className="fr-grid-row fr-pt-3w">
            <div className="fr-col">
              <p className="fr-text--md">
                Vous n'avez pas encore de compte ?{" "}
                <a href={routes.signup.index} className="fr-link">
                  Inscrivez-vous
                </a>
              </p>
              <p className="fr-text--md">
                Vous n'avez pas reçu d'email d'activation suite à votre
                inscription ?{" "}
                <a href={routes.resendActivationEmail} className="fr-link">
                  Renvoyer l'email d'activation
                </a>
              </p>
              <p className="fr-text--md">
                Vous avez perdu votre mot de passe ?{" "}
                <a href={routes.passwordResetRequest} className="fr-link">
                  Réinitialisez-le
                </a>
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
