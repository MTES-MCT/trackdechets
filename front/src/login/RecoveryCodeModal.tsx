import React, { createRef, useState } from "react";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";
import TdModal from "../Apps/common/Components/Modal/Modal";
import { envConfig } from "../common/envConfig";

type RecoveryErrorCode =
  | "INVALID_RECOVERY_CODE"
  | "MISSING_RECOVERY_CODE"
  | "RECOVERY_LOCKOUT";

type RecoveryAction = "RESET" | "TEMPORARY";

type Props = {
  onClose: () => void;
  errorCode?: RecoveryErrorCode | string | null;
  returnTo?: string;
  attemptsRemaining?: number | string | null;
};

const title =
  "Je n'ai pas accès à mon application d'authentification multifactorielle";

function attemptsRemainingLabel(attemptsRemaining: number): string {
  return attemptsRemaining === 1
    ? "Il vous reste 1 tentative."
    : `Il vous reste ${attemptsRemaining} tentatives.`;
}

export default function RecoveryCodeModal({
  onClose,
  errorCode,
  returnTo,
  attemptsRemaining
}: Props) {
  const [code, setCode] = useState("");
  const [recoveryAction, setRecoveryAction] = useState<RecoveryAction | null>(
    null
  );
  const [showSelectionError, setShowSelectionError] = useState(false);
  const formRef = createRef<HTMLFormElement>();
  const { VITE_API_ENDPOINT } = envConfig;

  const isLockout = errorCode === "RECOVERY_LOCKOUT";
  const isInvalidCode =
    errorCode === "INVALID_RECOVERY_CODE" ||
    errorCode === "MISSING_RECOVERY_CODE";

  const parsedAttemptsRemaining =
    attemptsRemaining != null ? Number(attemptsRemaining) : null;

  const topAlert = isLockout ? (
    <div className="fr-mb-3w">
      <Alert
        title="Fonctionnalité de récupération suspendue"
        description={
          <>
            Suite aux 3 tentatives successives en erreur, la fonctionnalité de
            récupération est temporairement suspendue pendant 1h. Merci de bien
            vouloir réessayer plus tard ou contacter notre support via
            l'Assistance Trackdéchets.
            <br />
            <a
              href="https://assistance.trackdechets.beta.gouv.fr/"
              className="fr-link "
              target="_blank"
              rel="noopener noreferrer"
            >
              Contacter l'assistance.
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
            successives en échec entraînera une suspension pendant 1h de la
            fonctionnalité de récupération.
            {parsedAttemptsRemaining != null && (
              <> {attemptsRemainingLabel(parsedAttemptsRemaining)}</>
            )}
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
      <p className="fr-text--lead fr-mb-1w">
        Veuillez renseigner la clé de récupération
      </p>
      <form
        ref={formRef}
        action={`${VITE_API_ENDPOINT}/recovery-login`}
        method="post"
        onSubmit={e => {
          if (isLockout) {
            e.preventDefault();
            return;
          }
          if (!recoveryAction) {
            e.preventDefault();
            setShowSelectionError(true);
          }
        }}
      >
        {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
        <input
          type="hidden"
          name="recoveryAction"
          value={recoveryAction ?? ""}
        />

        <p className="fr-mb-2w">
          A la validation de votre code de récupération vous pourrez :
        </p>

        <RadioButtons
          legend=""
          disabled={isLockout}
          options={[
            {
              label:
                "Soit réinitialiser votre authentification multifactorielle (ce parcours nécessite votre téléphone pour pouvoir poursuivre)",
              nativeInputProps: {
                checked: recoveryAction === "RESET",
                onChange: () => {
                  setRecoveryAction("RESET");
                  setShowSelectionError(false);
                }
              }
            },
            {
              label:
                "Soit utiliser ce code pour vous connecter une fois à la plateforme. Ce code sera consommé et ne pourra plus être utilisé. Après utilisation de votre dernier code cette option ne sera plus disponible et il vous faudra réinitialiser votre authentification multifactorielle",
              nativeInputProps: {
                checked: recoveryAction === "TEMPORARY",
                onChange: () => {
                  setRecoveryAction("TEMPORARY");
                  setShowSelectionError(false);
                }
              }
            }
          ]}
        />

        <Input
          label="Clé de récupération"
          state={isInvalidCode || isLockout ? "error" : "default"}
          nativeInputProps={{
            type: "password",
            name: "recoveryCode",
            value: code,
            autoComplete: "off",
            placeholder: "Ex : ABCDE-FGHIJ-KLMNO-PQRST",
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
        {showSelectionError && (
          <p className="fr-error-text fr-mt-1w fr-mb-0 fr-text--right">
            Merci de sélectionner une option pour poursuivre.
          </p>
        )}
      </form>
    </TdModal>
  );
}
