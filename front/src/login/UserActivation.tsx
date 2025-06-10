import React, { createRef } from "react";
import * as queryString from "query-string";
import { useLocation, Navigate } from "react-router-dom";
import routes from "../Apps/routes";

import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import styles from "./Login.module.scss";

function getErrorMessage(errorCode: string) {
  if (errorCode === "INVALID_OR_MISSING_HASH") {
    return "Le lien est invalide, vous pouvez demander un nouveau courriel d'activation";
  }

  return "Invalide";
}

export default function UserActivation() {
  const location = useLocation();

  const queries = queryString.parse(location.search);

  const formRef = createRef<HTMLFormElement>();
  const { VITE_API_ENDPOINT } = import.meta.env;

  if (queries.errorCode) {
    const { errorCode } = queries;
    const state = {
      ...(queries.errorCode ? { errorCode } : {})
    };

    return <Navigate to={{ pathname: routes.userActivation }} state={state} />;
  }

  const { errorCode } = location.state || {};

  const alert = errorCode ? (
    <div className="fr-grid-row fr-mb-2w">
      <Alert
        title="Erreur"
        description={getErrorMessage(errorCode)}
        severity="error"
      />
    </div>
  ) : null;

  return (
    <div className={styles.onboardingWrapper}>
      <form
        ref={formRef}
        action={`${VITE_API_ENDPOINT}/userActivation`}
        method="post"
        name="userActivation"
      >
        <div className={`fr-container fr-pt-10w ${styles.centralContainer}`}>
          {alert}
          <div className="fr-grid-row fr-grid-row--center fr-mb-2w">
            <div className="fr-col fr-m-auto">
              <h1 className="fr-h3 fr-mb-3w">
                Activation du compte utilisateur
              </h1>
              <p>
                Dernière étape, pour accéder à Trackdéchets, activez votre
                compte.
              </p>
              {queries?.hash && (
                <input type="hidden" name="hash" value={queries.hash} />
              )}
            </div>
          </div>
          <div className="fr-grid-row fr-grid-row--right">
            <div className="fr-col">
              <Button size="medium" nativeButtonProps={{ type: "submit" }}>
                Activer mon compte
              </Button>
            </div>
          </div>
          {errorCode && (
            <div className="fr-grid-row fr-pt-3w">
              <div className="fr-col">
                <p className="fr-text--md">
                  Vous n'avez pas encore de compte ?{" "}
                  <a href={routes.signup.index} className="fr-link">
                    Inscrivez-vous
                  </a>
                </p>
                <p className="fr-text--md">
                  Vous n'avez pas reçu le courriel d'activation suite à votre
                  inscription ?{" "}
                  <a href={routes.resendActivationEmail} className="fr-link">
                    Renvoyer le courriel d'activation
                  </a>
                </p>
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
