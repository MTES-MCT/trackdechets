import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@apollo/client";
import { Mutation, MutationSignupArgs } from "@td/codegen-ui";
import { SIGNUP } from "./mutations";
import PasswordHelper, {
  getPasswordHint
} from "../common/components/PasswordHelper";

import routes from "../Apps/routes";

import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { PasswordInput } from "@codegouvfr/react-dsfr/blocks/PasswordInput";
import SingleCheckbox from "../Apps/common/Components/SingleCheckbox/SingleCheckbox";
import styles from "./Login.module.scss";

import { SENDER_EMAIL } from "../common/config";
import { isEmail, isGenericEmail } from "@td/constants";

export default function Signup() {
  const [submittable, setSubmittable] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [signupCompleted, setSignupCompleted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [nameValue, setNameValue] = useState("");
  const [emailValue, setEmailValue] = useState("");
  const [passwordValue, setPasswordValue] = useState("");
  const [cguValue, setCguValue] = useState(false);
  const [validPasswordValue, setValidPasswordValue] = useState(false);
  const [signup] = useMutation<Pick<Mutation, "signup">, MutationSignupArgs>(
    SIGNUP
  );

  const navigate = useNavigate();

  const handleSubmit = event => {
    event?.preventDefault();

    if (!submittable || submitting) return;

    const userInfos = {
      email: emailValue || "",
      name: nameValue || "",
      password: passwordValue || ""
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
    navigate(routes.login);
  };

  useEffect(() => {
    getPasswordHint(passwordValue).then(({ hintType }) => {
      const validPasswordValue = hintType !== "error" && !!passwordValue;
      setValidPasswordValue(validPasswordValue);
    });
  }, [passwordValue]);

  useEffect(() => {
    const formFilled =
      !!nameValue && !!emailValue && validPasswordValue && !!cguValue;

    setSubmittable(formFilled);
  }, [nameValue, emailValue, validPasswordValue, cguValue]);

  const alert =
    errorMessage.length > 0 ? (
      <div className="fr-grid-row fr-mb-2w">
        <Alert title="Erreur" description={errorMessage} severity="error" />
      </div>
    ) : null;

  const handleEmailChange = e => {
    const { value } = e.target;

    if (isEmail(value)) {
      setEmailValue(value);
      setErrorMessage("");
    } else {
      setErrorMessage("Format du courriel invalide");
    }
    if (!value) {
      setErrorMessage("");
    }
  };

  const formContent = (
    <form onSubmit={handleSubmit}>
      <div className={`fr-container fr-pt-10w ${styles.centralContainer}`}>
        <div className="fr-grid-row fr-grid-row--center fr-mb-2w">
          <div className="fr-col fr-m-auto">
            <h1 className="fr-h3 fr-mb-1w">Créer mon compte Trackdéchets</h1>
            <p className="fr-text--md fr-mb-3w">
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
                id: "fullnameSignUp"
              }}
            />
            <Input
              label="Courriel"
              nativeInputProps={{
                required: true,
                type: "email",
                onChange: handleEmailChange
              }}
            />
            {Boolean(emailValue) && isGenericEmail(emailValue) && (
              <Alert
                className="fr-mb-3w"
                description="Dans le cas où vous posséderiez un courriel professionnel avec un nom de domaine d'entreprise (ex : nom@votre-entreprise.fr), nous vous recommandons de l'utiliser pour la création de votre compte, afin de faciliter le processus de vérification de rattachement à votre établissement."
                severity="info"
                closable={false}
                small
              />
            )}

            <PasswordInput
              label="Mot de passe"
              nativeInputProps={{
                required: true,
                onChange: e => setPasswordValue(e.target.value)
              }}
            />

            <PasswordHelper password={passwordValue} />
          </div>
        </div>
        <div className="fr-grid-row fr-mb-2w">
          <div className={`fr-col ${styles.resetFlexCol}`}>
            <SingleCheckbox
              options={[
                {
                  label: "Je certifie avoir lu les conditions générales",
                  nativeInputProps: {
                    onChange: e => {
                      setCguValue(e.currentTarget.checked);
                    }
                  }
                }
              ]}
            />
            <a
              href="https://trackdechets.beta.gouv.fr/cgu"
              target="_blank"
              rel="noopener noreferrer"
              className="fr-link force-external-link-content force-underline-link"
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
            Un courriel de confirmation vous a été envoyé à l'adresse{" "}
            <strong>{emailValue}</strong> 📨
          </p>
          <p className="fr-text--md">
            <span role="img" aria-label="emoji finger">
              👉
            </span>{" "}
            Il peut mettre quelques minutes à arriver
          </p>
          <p className="fr-text--md">
            <span role="img" aria-label="emoji finger">
              👉
            </span>{" "}
            Vérifiez vos spams ou indésirables
          </p>
          <p className="fr-text--md">
            <span role="img" aria-label="emoji finger">
              👉
            </span>{" "}
            Ajoutez {SENDER_EMAIL} à vos contacts
          </p>
          <p className="fr-text--md">
            <span role="img" aria-label="emoji finger">
              👉
            </span>{" "}
            Si vous n'avez pas reçu le courriel de confirmation au bout d'une
            heure, vous pouvez le renvoyer depuis{" "}
            <a href={routes.resendActivationEmail} className="fr-link">
              cette page
            </a>
          </p>
          <p className="fr-text--md">
            Le message peut ne pas arriver pour les raisons suivantes :<br />-
            courriel erroné
            <br />- antivirus ou suite logicielle de sécurité trop restrictifs
          </p>
          <p className="fr-text--md">
            Pour finaliser votre inscription, cliquez sur le lien qui vous a été
            envoyé par courriel. Vous pourrez ensuite vous connecter à
            Trackdéchets.{" "}
            <span role="img" aria-label="emoji rocket">
              🚀
            </span>
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
