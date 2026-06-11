import React, { createRef, useState } from "react";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import TdModal from "../Apps/common/Components/Modal/Modal";
import { envConfig } from "../common/envConfig";

type RecoveryErrorCode =
  | "INVALID_RECOVERY_CODE"
  | "MISSING_RECOVERY_CODE"
  | "RECOVERY_LOCKOUT";

type Props = {
  onClose: () => void;
  errorCode?: RecoveryErrorCode | string | null;
  returnTo?: string;
};

const title = "Je n'ai pas accès à l'application";

export default function RecoveryCodeModal({
  onClose,
  errorCode,
  returnTo
}: Props) {
  const [code, setCode] = useState("");
  const formRef = createRef<HTMLFormElement>();
  const { VITE_API_ENDPOINT } = envConfig;

  const isLockout = errorCode === "RECOVERY_LOCKOUT";
  const isInvalidCode =
    errorCode === "INVALID_RECOVERY_CODE" ||
    errorCode === "MISSING_RECOVERY_CODE";

  const topAlert = isLockout ? (
    <div className="fr-mb-3w">
      <Alert
        title="Compte suspendu"
        description={
          <>
            Suite aux 3 tentatives successives en erreur. Votre compte est
            temporairement suspendu, contactez notre support via l'Assistance
            Trackdéchets.
            <br />
            <a
              href="https://assistance.trackdechets.beta.gouv.fr/"
              className="fr-link "
              target="_blank"
              rel="noopener noreferrer"
            >
              Contacter l’assistance.
            </a>
          </>
        }
        severity="warning"
      />
    </div>
  ) : null;
  const invalidCodeAlert = isInvalidCode ? (
    <div className="fr-mb-3w">
      <Alert
        title="Clé de récupération invalide"
        description={
          <>
            La clé renseignée est incorrecte, merci de bien vouloir vérifier le
            code renseigné ou d'en utiliser un autre. Attention 3 tentatives
            successives en échec déclenchera une suspension du compte.
          </>
        }
        severity="error"
      />
    </div>
  ) : null;

  return (
    <TdModal isOpen onClose={onClose} ariaLabel={title} title={title} size="L">
      {topAlert}
      {invalidCodeAlert}
      <p className="fr-text--lead fr-mb-3w">
        Veuillez renseigner la clé de récupération
      </p>
      <form
        ref={formRef}
        action={`${VITE_API_ENDPOINT}/recovery-login`}
        method="post"
      >
        {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}

        <Input
          label="Clé de récupération"
          state={isInvalidCode || isLockout ? "error" : "default"}
          nativeInputProps={{
            type: "password",
            name: "recoveryCode",
            value: code,
            autoComplete: "off",
            placeholder: "Ex : ABCDE-FGHIJ",
            onChange: e => setCode(e.target.value),
            disabled: isLockout
          }}
        />

        <div className="fr-btns-group fr-btns-group--right fr-btns-group--inline fr-mt-3w">
          <Button
            priority="secondary"
            nativeButtonProps={{ type: "button" }}
            onClick={onClose}
          >
            Fermer ×
          </Button>
          <Button
            nativeButtonProps={{ type: "submit" }}
            disabled={!code.trim() || isLockout}
          >
            Se connecter
          </Button>
        </div>
      </form>
    </TdModal>
  );
}
