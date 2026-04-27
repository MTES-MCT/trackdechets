import React, { useState } from "react";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { PasswordInput } from "@codegouvfr/react-dsfr/blocks/PasswordInput";
import TdModal from "../Apps/common/Components/Modal/Modal";
import { envConfig } from "../common/envConfig";

type Props = {
  onClose: () => void;
  errorCode?: string;
  returnTo?: string;
};

export default function RecoveryCodeModal({
  onClose,
  errorCode: initialErrorCode,
  returnTo
}: Props) {
  const [code, setCode] = useState("");
  const [errorCode, setErrorCode] = useState(initialErrorCode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { VITE_API_ENDPOINT } = envConfig;

  const isInvalidCode = errorCode === "INVALID_RECOVERY_CODE";
  const isLockout = errorCode === "RECOVERY_LOCKOUT";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || isLockout || isSubmitting) return;

    setIsSubmitting(true);
    setErrorCode(undefined);

    try {
      const body = new URLSearchParams({ recoveryCode: code });
      if (returnTo) body.append("returnTo", returnTo);

      const response = await fetch(`${VITE_API_ENDPOINT}/recovery`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "X-Requested-With": "fetch"
        },
        body: body.toString(),
        credentials: "include"
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setErrorCode(
          (data as { errorCode?: string }).errorCode ?? "INVALID_RECOVERY_CODE"
        );
        return;
      }

      const data = await response.json().catch(() => ({}));
      const redirectTo =
        (data as { redirectTo?: string }).redirectTo ?? "/";
      window.location.href = redirectTo;
    } catch {
      setErrorCode("INVALID_RECOVERY_CODE");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <TdModal
      isOpen
      onClose={onClose}
      ariaLabel="Je n'ai pas accès à l'application"
      title="Je n'ai pas accès à l'application"
      size="M"
    >
      {isInvalidCode && (
        <Alert
          className="fr-mb-3w"
          title="Clé de récupération incorrecte"
          description="La clé renseignée est incorrecte, merci de bien vouloir vérifier le code renseigné ou d'en utiliser un autre. Attention 3 tentatives successives en échec déclenchera une suspension du compte."
          severity="error"
        />
      )}
      {isLockout && (
        <Alert
          className="fr-mb-3w"
          title="Compte suspendu"
          description={
            <>
              Suite aux 3 tentatives successives en erreur. Votre compte est
              temporairement suspendu, contactez notre support via l'Assistance
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
          severity="error"
        />
      )}

      <p className="fr-text--sm fr-mb-2w">
        Veuillez renseigner la clé de récupération
      </p>

      <form onSubmit={handleSubmit}>
        <PasswordInput
          label="Clé de récupération"
          state={isInvalidCode || isLockout ? "error" : "default"}
          nativeInputProps={{
            name: "recoveryCode",
            value: code,
            disabled: isLockout,
            autoComplete: "off",
            onChange: e => setCode(e.target.value)
          }}
        />
        <div className="fr-btns-group fr-btns-group--right fr-btns-group--inline fr-mt-3w">

          <Button
            nativeButtonProps={{ type: "submit" }}
            disabled={!code.trim() || isLockout || isSubmitting}
          >
            {isSubmitting ? "Connexion…" : "Se connecter"}
          </Button>
        </div>
      </form>
    </TdModal>
  );
}
