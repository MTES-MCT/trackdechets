import React, { useState, createRef } from "react";
import * as queryString from "query-string";
import { useLocation, Navigate } from "react-router-dom";
import routes from "../Apps/routes";

import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";

import styles from "./Login.module.scss";

function getErrorMessage(errorCode: string) {
  if (errorCode === "INVALID_TOTP") {
    return "Le code d'authentification est invalide";
  }
  if (errorCode === "MISSING_TOTP") {
    return "Le code d'authentification est manquant";
  }

  return "Erreur serveur";
}

export default function SecondFactor() {
  const location = useLocation();

  const [totp, setTotp] = useState("");

  const queries = queryString.parse(location.search);

  const formRef = createRef<HTMLFormElement>();
  const { VITE_API_ENDPOINT } = import.meta.env;

  if (queries.errorCode || queries.returnTo) {
    const { errorCode, returnTo, username } = queries;
    const state = {
      ...(queries.errorCode ? { errorCode, username } : {}),
      ...(!!returnTo ? { returnTo } : {})
    };

    return <Navigate to={{ pathname: routes.secondFactor }} state={state} />;
  }
  const { errorCode } = queries;
  const { returnTo } = location.state || {};

  const code = Array.isArray(errorCode) ? errorCode[0] : errorCode;

  const alert = code ? (
    <div className="fr-grid-row fr-mb-2w">
      <Alert
        title="Erreur"
        description={getErrorMessage(code)}
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
