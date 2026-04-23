import React, { useState, createRef, useEffect } from "react";
import * as queryString from "query-string";
import { useLocation, Navigate } from "react-router-dom";
import routes from "../Apps/routes";

import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";

import styles from "./Login.module.scss";
import { envConfig } from "../common/envConfig";

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (minutes > 0 && secs > 0) {
    return `${minutes} ${minutes > 1 ? "minutes" : "minute"} ${secs} ${
      secs > 1 ? "secondes" : "seconde"
    }`;
  }
  if (minutes > 0) {
    return `${minutes} ${minutes > 1 ? "minutes" : "minute"}`;
  }
  return `${seconds} ${seconds > 1 ? "secondes" : "seconde"}`;
}

function Countdown({ timestamp }: { timestamp: number }) {
  const calculateSeconds = () =>
    Math.max(0, Math.floor((timestamp - Date.now()) / 1000));

  const [seconds, setSeconds] = useState(calculateSeconds);

  useEffect(() => {
    if (seconds > 0) {
      const timer = setTimeout(() => setSeconds(s => s - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [seconds]);

  if (seconds <= 0) {
    return <span>Vous pouvez réessayer.</span>;
  }
  return <span>dans {formatDuration(seconds)}.</span>;
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
  const lockoutTimestamp = lockout ? Number(lockout) : undefined;

  const isLockout = code === "TOTP_LOCKOUT";
  const isAccountSuspended = code === "ACCOUNT_SUSPENDED";
  const isInvalidTotp = code === "INVALID_TOTP" || code === "MISSING_TOTP";

  const topAlert = isLockout ? (
    <div className="fr-grid-row fr-mb-3w">
      <Alert
        title="Blocage temporaire"
        description={
          <>
            Suite aux 5 tentatives successives en erreur, la connexion est
            temporairement bloquée. Merci de bien vouloir réessayer{" "}
            {lockoutTimestamp ? (
              <Countdown timestamp={lockoutTimestamp} />
            ) : (
              "dans 5 minutes."
            )}
          </>
        }
        severity="warning"
      />
    </div>
  ) : isAccountSuspended ? (
    <div className="fr-grid-row fr-mb-3w">
      <Alert
        title="Compte suspendu"
        description={
          <>
            Votre compte est temporairement suspendu dans le cadre d'une
            procédure de récupération en cours. Si vous n'êtes pas à l'origine
            de cette demande, contactez notre support via l'Assistance
            Trackdéchets.{" "}
            <a
              href="https://faq.trackdechets.fr/contact"
              className="fr-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              Contacter l'assistance
            </a>
          </>
        }
        severity="warning"
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
          {topAlert}
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
                state={isInvalidTotp ? "error" : "default"}
                stateRelatedMessage={
                  isInvalidTotp
                    ? "Code incorrect. Veuillez vérifier le code affiché dans votre application."
                    : undefined
                }
                nativeInputProps={{
                  value: totp,
                  name: "totp",
                  autoComplete: "one-time-code",
                  inputMode: "numeric",
                  pattern: "[0-9]*",
                  maxLength: 6,
                  required: true,
                  placeholder: "Entrez le code à usage unique",
                  onChange: e => setTotp(e.target.value)
                }}
                label="Code d'identification"
              />

              {/* TRA-17923 : ce bouton ouvrira la modale de récupération */}
              <button
                type="button"
                className="fr-link fr-mb-2w"
                onClick={() => {
                  /* TODO TRA-17923 */
                }}
              >
                Je n'ai pas accès à l'application
              </button>
            </div>
          </div>

          <div className="fr-grid-row fr-grid-row--right fr-mt-2w">
            <div className={`fr-col ${styles.resetFlexCol}`}>
              <Button
                size="medium"
                priority="secondary"
                linkProps={{ href: routes.login }}
                className="fr-mr-2w"
              >
                Annuler
              </Button>
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
