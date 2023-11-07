import { useMutation, gql } from "@apollo/client";
import React, { useState } from "react";
import { Mutation, MutationCreatePasswordResetRequestArgs } from "codegen-ui";
import Loader from "../Apps/common/Components/Loader/Loaders";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Captcha, useCaptcha } from "../common/components/captcha";

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
  const [createPasswordResetRequest, { data, error }] = useMutation<
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
          captcha: { token: captchaData?.token ?? "", value: captchaInput }
        }
      },

      onError: () => {
        setCaptchaInput("");
        refetchCaptcha();
      },
      onCompleted: () => {
        setCaptchaInput("");
        refetchCaptcha();
        setEmail("");
      }
    });
  };

  const errorMessage = error?.networkError
    ? "Vous avez dépassé votre quota. Veuillez réessayer dans quelques minutes."
    : error?.message;

  const errorAlert = error?.message ? (
    <div className="fr-grid-row fr-mb-2w">
      <Alert title="Erreur" description={errorMessage} severity="error" />
    </div>
  ) : null;

  const successAlert = data ? (
    <div className="fr-grid-row fr-mb-2w">
      <Alert
        title="Succès"
        description="Si l'adresse email existe dans notre système, vous allez recevoir un email (veuillez également vérifier dans votre dossier de courrier indésirable)."
        severity="success"
      />
    </div>
  ) : null;

  if (captchaLoading) {
    return <Loader />;
  }
  if (captchaError) {
    return (
      <div className="fr-grid-row fr-mb-2w">
        <Alert
          title="Erreur"
          description="Une erreur est survenue, veuillez rafraîchir la page"
          severity="error"
        />
      </div>
    );
  }

  return (
    <div className={styles.onboardingWrapper}>
      <form onSubmit={handleSubmit}>
        <div
          className={`fr-container fr-pt-10w ${styles.centralContainerLarge}`}
        >
          {successAlert}
          {errorAlert}

          <div className="fr-grid-row fr-grid-row--center fr-mb-2w">
            <div className="fr-col fr-m-auto">
              <h1 className="fr-h3 fr-mb-3w">
                Réinitialisation de votre mot de passe
              </h1>
              <p className="fr-text--md">
                Afin de réinitialiser votre mot de passe, merci de saisir votre
                email. Un lien vous sera transmis à cette adresse email.
              </p>
              <Input
                label="Email"
                nativeInputProps={{
                  name: "email",
                  value: email,
                  onChange: e => setEmail(e.target.value),
                  required: true
                }}
              />
            </div>
          </div>
          <Captcha
            setCaptchaInput={setCaptchaInput}
            captchaImg={captchaData?.img}
            captchaInput={captchaInput}
            captchaToken={captchaData?.token}
            refetch={refetchCaptcha}
          />
          <div className="fr-grid-row fr-grid-row--right">
            <div className={`fr-col ${styles.resetFlexCol}`}>
              <Button
                disabled={!email || !captchaInput}
                size="medium"
                onClick={handleSubmit}
              >
                Réinitialiser
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
