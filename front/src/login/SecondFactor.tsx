import React, { useState, createRef, useEffect } from "react";
import * as queryString from "query-string";
import { useLocation, Navigate } from "react-router-dom";
import routes from "../Apps/routes";

import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";

import styles from "./Login.module.scss";
import { envConfig } from "../common/envConfig";

function getErrorMessage(
  errorCode: string,
  lockout?: string
): string | React.JSX.Element {
  if (errorCode === "INVALID_TOTP") {
    return <Countdown timestamp={lockout} />;
  }
  if (errorCode === "MISSING_TOTP") {
    return "Le code d'authentification est manquant";
  }
  if (errorCode == "TOTP_LOCKOUT") {
    return <Countdown timestamp={lockout} />;
  }

  return "Erreur serveur";
}

function Countdown({ timestamp }) {
  const calculateSeconds = () => {
    return Math.max(0, Math.floor((timestamp - Date.now()) / 1000));
  };

  const [seconds, setSeconds] = useState(calculateSeconds);

  useEffect(() => {
    if (seconds > 0) {
      const timer = setTimeout(() => {
        setSeconds(seconds - 1);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [seconds]);

  return (
    <span>
      {seconds > 0
        ? `Le code d'authentification est invalide. Merci d'attendre ${seconds}  ${
            seconds > 1 ? "secondes" : "seconde"
          } avant de faire un nouvel essai.`
        : "Vous pouvez entrer votre code"}
    </span>
  );
}

export default function SecondFactor() {
  const location = useLocation();

  const [totp, setTotp] = useState("");

  const queries = queryString.parse(location.search);

  const formRef = createRef<HTMLFormElement>();
  const { VITE_API_ENDPOINT } = envConfig;

  if (queries.errorCode || queries.returnTo) {
    const { errorCode, returnTo, username, lockout = 0 } = queries;
    const state = {
      ...(queries.errorCode ? { errorCode, username, lockout } : {}),
      ...(!!returnTo ? { returnTo } : {})
    };

    return <Navigate to={{ pathname: routes.secondFactor }} state={state} />;
  }
  const { returnTo, errorCode, lockout } = location.state || {};

  const code = Array.isArray(errorCode) ? errorCode[0] : errorCode;

  const alert = code ? (
    <div className="fr-grid-row fr-mb-2w">
      <Alert
        title="Erreur"
        description={getErrorMessage(code, lockout)}
        severity="error"
      />
    </div>
  ) : null;

  return (
    <div className={styles.onboardingWrapper}>
      <form
        ref={formRef}
        action={`${VITE_API_ENDPOINT}/otp`}
        method="post"
        name="login"
      >
        <div className={`fr-container fr-pt-10w ${styles.totpContainer}`}>
          {/*<Alert title="Erreur" description={Countdown({lockout})} severity="error" />*/}
          {alert}
          <div className="fr-grid-row fr-grid-row--center fr-mb-2w">
            <div className="fr-col fr-m-auto">
              <h1 className="fr-h3 fr-mb-3w">
                Authentification en deux étapes
              </h1>
              <p className="fr-mb-2w">
                Veuillez entrer le code généré par votre application mobile.
              </p>

              {returnTo && (
                <input type="hidden" name="returnTo" value={returnTo} />
              )}

              <Input
                nativeInputProps={{
                  value: totp,
                  name: "totp",
                  autoComplete: "one-time-code", // to allow passwords managers autocompletion
                  inputMode: "numeric",
                  pattern: "[0-9]*",
                  maxLength: 6,
                  required: true,
                  placeholder: "ex: 123456",
                  onChange: e => setTotp(e.target.value)
                }}
                label="Code d’authentification"
              />
            </div>
          </div>
          <div className="fr-grid-row fr-grid-row--right">
            <div className={`fr-col ${styles.resetFlexCol}`}>
              <Button size="medium" nativeButtonProps={{ type: "submit" }}>
                Se connecter
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
