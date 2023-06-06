import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import { useMutation } from "@apollo/client";
import { Mutation, MutationSignupArgs } from "generated/graphql/types";
import { SIGNUP } from "./mutations";
import PasswordHelper from "common/components/PasswordHelper";

import routes from "common/routes";

import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Checkbox } from "@codegouvfr/react-dsfr/Checkbox";
import { PasswordInput } from "@codegouvfr/react-dsfr/blocks/PasswordInput";
import styles from "./Login.module.scss";

import { SENDER_EMAIL } from "common/config";

export default function Signup() {
  const [submittable, setSubmittable] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [signupCompleted, setSignupCompleted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [nameValue, setNameValue] = useState("");
  const [emailValue, setEmailValue] = useState("");
  const [passwordValue, setPasswordValue] = useState("");
  const [cguValue, setCguValue] = useState(false);

  const [signup] = useMutation<Pick<Mutation, "signup">, MutationSignupArgs>(
    SIGNUP
  );

  const history = useHistory();

  useEffect(() => {
    document.title = `Créer un compte | ${document.title}`;
  }, []);

  const handleSubmit = event => {
    event?.preventDefault();

    if (!submittable || submitting) return;

    const userInfos = {
      email: emailValue || "",
      name: nameValue || "",
      password: passwordValue || "",
    };

    setSubmitting(true);

    signup({ variables: { userInfos } })
      .then(_ => {
        setSignupCompleted(true);
      })
      .catch(_ => {
        setErrorMessage(
          _.message || "Une erreur est survenue, veuillez réessayer."
        );
        // error message might be off-screen, let's scroll to top
        window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
        setSubmitting(false);
      });
  };

  const onConnectClick = () => {
    history.push({
      pathname: routes.login,
    });
  };

  useEffect(() => {
    const formFilled =
      !!nameValue && !!emailValue && !!passwordValue && !!cguValue;

    setSubmittable(formFilled);
  }, [nameValue, emailValue, passwordValue, cguValue]);

  const alert =
    errorMessage.length > 0 ? (
      <div className="fr-grid-row fr-mb-2w">
        <Alert title="Erreur" description={errorMessage} severity="error" />
      </div>
    ) : null;

  const formContent = (
    <form onSubmit={handleSubmit}>
      <div className={`fr-container fr-pt-10w ${styles.centralContainer}`}>
        <div className="fr-grid-row fr-grid-row--center fr-mb-2w">
          <div className="fr-col fr-m-auto">
            <h1 className="fr-h3 fr-mb-1w">Créer mon compte Trackdéchets</h1>
            <p className="fr-text--md fr-mb-1w">
              Vous vous apprêtez à créer votre compte utilisateur. Cette étape
              est préalable à l'enregistrement ou au rattachement d'une
              entreprise dans Trackdéchets.
            </p>
            {alert}
            <p className="fr-text--bold">Vos informations :</p>
            <Input
              label="Nom et prénom"
              nativeInputProps={{
                required: true,
                onChange: e => setNameValue(e.target.value),
              }}
            />
            <Input
              label="Email"
              nativeInputProps={{
                required: true,
                onChange: e => setEmailValue(e.target.value),
              }}
            />
            <PasswordInput
              label="Mot de passe"
              nativeInputProps={{
                required: true,
                onChange: e => setPasswordValue(e.target.value),
              }}
            />

            <PasswordHelper password={passwordValue} />
          </div>
        </div>
        <div className="fr-grid-row fr-mb-2w">
          <div className={`fr-col ${styles.resetFlexCol}`}>
            <Checkbox
              options={[
                {
                  label: "Je certifie avoir lu les conditions générales",
                  nativeInputProps: {
                    onChange: e => {
                      setCguValue(e.currentTarget.checked);
                    },
                  },
                },
              ]}
            />
            <a
              href="https://trackdechets.beta.gouv.fr/cgu"
              target="_blank"
              rel="noopener noreferrer"
              className="fr-link"
            >
              Voir les conditions générales.
            </a>
          </div>
        </div>
        <div className="fr-grid-row fr-grid-row--right">
          <div className={`fr-col ${styles.resetFlexCol}`}>
            <Button
              iconId="ri-arrow-right-line"
              iconPosition="right"
              size="medium"
              title={submitting ? "Création en cours..." : "Créer mon compte"}
              disabled={!submittable || submitting}
              onClick={handleSubmit}
            >
              Créer mon compte
            </Button>
          </div>
        </div>
      </div>
    </form>
  );

  const successContent = (
    <div className={`fr-container fr-pt-10w ${styles.centralContainerLarge}`}>
      <div className="fr-grid-row fr-grid-row--center fr-mb-2w">
        <div className="fr-col fr-m-auto fr-pr-2w">
          <h1 className="fr-h3 fr-mb-1w">On y est presque !</h1>
          <p className="fr-text--md fr-mb-1w">
            Un email de confirmation vous a été envoyé à l'adresse{" "}
            <strong>{emailValue}</strong> 📨
          </p>
          <p className="fr-text--md">
            👉 Il peut mettre quelques minutes à arriver
          </p>
          <p className="fr-text--md">👉 Vérifiez vos spams ou indésirables</p>
          <p className="fr-text--md">
            👉 Ajoutez {SENDER_EMAIL} à vos contacts
          </p>
          <p className="fr-text--md">
            👉 Si vous n'avez pas reçu l'email de confirmation au bout d'une
            heure, vous pouvez le renvoyer depuis{" "}
            <a href={routes.resendActivationEmail} className="fr-link">
              cette page
            </a>
          </p>
          <p className="fr-text--md">
            Le message peut ne pas arriver pour les raisons suivantes :<br />-
            adresse email erronée
            <br />- antivirus ou suite logicielle de sécurité trop restrictifs
          </p>
          <p className="fr-text--md">
            Pour finaliser votre inscription, cliquez sur le lien qui vous a été
            envoyé par email. Vous pourrez ensuite vous connecter à
            Trackdéchets. 🚀
          </p>
          <p className="fr-text--md">
            Des questions, des interrogations ? N'hésitez pas à nous contacter
            via{" "}
            <a
              href="https://faq.trackdechets.fr/pour-aller-plus-loin/assistance"
              className="fr-link"
            >
              la FAQ
            </a>
            .
          </p>
        </div>
      </div>
      <div className="fr-grid-row fr-grid-row--right">
        <div className={`fr-col ${styles.resetFlexCol}`}>
          <Button size="medium" title="Se connecter" onClick={onConnectClick}>
            Se connecter
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={styles.onboardingWrapper}>
      {signupCompleted ? successContent : formContent}
    </div>
  );
}
