import { useMutation, gql } from "@apollo/client";
import React, { useState } from "react";
import { Mutation, MutationResendActivationEmailArgs } from "@td/codegen-ui";
import Loader from "../Apps/common/Components/Loader/Loaders";
import { Captcha, useCaptcha } from "../common/components/captcha";

import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import styles from "./Login.module.scss";

const RESEND_ACTIVATION_EMAIL = gql`
  mutation ResendActivationEmail($input: ResendActivationEmailInput!) {
    resendActivationEmail(input: $input)
  }
`;

export default function ResendActivationEmail() {
  const [email, setEmail] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");

  const [resendActivationEmail, { data, error }] = useMutation<
    Pick<Mutation, "resendActivationEmail">,
    MutationResendActivationEmailArgs
  >(RESEND_ACTIVATION_EMAIL);
  const { captchaLoading, captchaError, captchaData, refetchCaptcha } =
    useCaptcha(true);

  const handleSubmit = event => {
    event.preventDefault();

    resendActivationEmail({
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

  const errorAlert = error?.message ? (
    <div className="fr-grid-row fr-mb-2w">
      <Alert title="Erreur" description={error.message} severity="error" />
    </div>
  ) : null;

  const successAlert = data ? (
    <div className="fr-grid-row fr-mb-2w">
      <Alert
        title="Succès"
        description="Si votre compte est effectivement en attente sur notre plateforme, un email d'activation vous a été renvoyé."
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
              <h1 className="fr-h3 fr-mb-3w">Renvoyer l'email d'activation</h1>
              <p className="fr-text--md">
                Si vous n'avez pas reçu d'email d'activation suite à votre
                inscription, vous pouvez en renvoyer un en renseignant votre
                adresse email ci-dessous :
              </p>
              <Input
                label="Email"
                nativeInputProps={{
                  name: "email",
                  required: true,
                  value: email,
                  onChange: e => setEmail(e.target.value)
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
                Renvoyer l'email
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
