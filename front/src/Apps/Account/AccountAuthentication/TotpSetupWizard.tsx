import React, { useState } from "react";
import { gql, useMutation } from "@apollo/client";
import QRCode from "react-qr-code";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import TdModal from "../../common/Components/Modal/Modal";
import { DsfrNotificationError } from "../../common/Components/Error/Error";

const GENERATE_TOTP_SETUP = gql`
  mutation GenerateTotpSetup {
    generateTotpSetup {
      secret
      qrCodeUrl
    }
  }
`;

const CONFIRM_TOTP_SETUP = gql`
  mutation ConfirmTotpSetup($code: String!) {
    confirmTotpSetup(code: $code) {
      codes
    }
  }
`;

// 4 étapes : QR code et validation sont fusionnés dans une même étape
type Step = "explanation" | "qrcode" | "recovery" | "success";

type Props = {
  onSuccess: () => void;
  onClose: () => void;
};

const STEP_LABELS: Record<Step, string> = {
  explanation: "Explication",
  qrcode: "QRcode",
  recovery: "Clé de récupération",
  success: "Confirmation"
};

// Label affiché dans le stepper pour indiquer l'étape suivante
const NEXT_STEP_LABELS: Partial<Record<Step, string>> = {
  explanation: "QRcode",
  qrcode: "Clé de récupération",
  recovery: "Confirmation"
};

const STEPS: Step[] = ["explanation", "qrcode", "recovery", "success"];

export default function TotpSetupWizard({ onSuccess, onClose }: Props) {
  const [step, setStep] = useState<Step>("explanation");

  // Étape 1
  const [appInstalled, setAppInstalled] = useState(false);
  const [showAppError, setShowAppError] = useState(false);

  // Étape 2
  const [secret, setSecret] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [showManualKey, setShowManualKey] = useState(false);

  // Étape 3
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [savedConfirmed, setSavedConfirmed] = useState(false);
  const [showSavedError, setShowSavedError] = useState(false);
  const [copied, setCopied] = useState(false);

  const stepIndex = STEPS.indexOf(step);
  const totalSteps = STEPS.length;
  const nextStepLabel = NEXT_STEP_LABELS[step];

  const [generateSetup, { loading: generating, error: generateError }] =
    useMutation(GENERATE_TOTP_SETUP);

  const [
    confirmSetup,
    { loading: confirming, error: confirmError, reset: resetConfirmError }
  ] = useMutation(CONFIRM_TOTP_SETUP);

  const goToQrCode = async () => {
    if (!appInstalled) {
      setShowAppError(true);
      return;
    }
    const { data } = await generateSetup();
    if (data?.generateTotpSetup) {
      setSecret(data.generateTotpSetup.secret);
      setQrCodeUrl(data.generateTotpSetup.qrCodeUrl);
      setStep("qrcode");
    }
  };

  const handleConfirmCode = async () => {
    const { data } = await confirmSetup({ variables: { code: totpCode } });
    if (data?.confirmTotpSetup?.codes) {
      setRecoveryCodes(data.confirmTotpSetup.codes);
      setStep("recovery");
    }
  };

  const handleCopyCodes = () => {
    navigator.clipboard.writeText(recoveryCodes.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCodes = () => {
    const content = [
      "Codes de récupération Trackdéchets",
      "====================================",
      "Conservez ces codes en lieu sûr.",
      "Chaque code est à usage unique.",
      "",
      ...recoveryCodes
    ].join("\n");

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "trackdechets-recovery-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFinish = () => {
    if (!savedConfirmed) {
      setShowSavedError(true);
      return;
    }
    setStep("success");
  };

  const title = "Activez l'authentification TOTP";

  return (
    <TdModal isOpen onClose={onClose} ariaLabel={title} title={title} size="L">
      {/* Stepper DSFR */}
      <div className="fr-stepper fr-mb-3w">
        <h2 className="fr-stepper__title">
          {STEP_LABELS[step]}
          <span className="fr-stepper__state">
            Étape {stepIndex + 1} sur {totalSteps}
          </span>
        </h2>
        <div
          className="fr-stepper__steps"
          data-fr-current-step={stepIndex + 1}
          data-fr-steps={totalSteps}
        />
        {nextStepLabel && (
          <p className="fr-stepper__details">
            <span className="fr-text--bold">Étape suivante :</span>{" "}
            {nextStepLabel}
          </p>
        )}
      </div>

      {/* Étape 1 : Explication */}
      {step === "explanation" && (
        <div>
          <p>
            Un code unique vous sera demandé à chaque nouvelle session. Pour
            l'obtenir, vous devez utiliser une application mobile.
          </p>
          <p>
            Si vous n'avez pas encore d'application, nous vous conseillons
            d'utiliser l'outil opensource{" "}
            <a
              href="https://freeotp.github.io/"
              target="_blank"
              rel="noopener noreferrer"
            >
              FreeOTP Authenticator
            </a>
            .
          </p>

          {generateError && (
            <DsfrNotificationError apolloError={generateError} />
          )}

          {/* Checkbox avec validation au clic (bouton non bloqué) */}
          <div
            className={`fr-checkbox-group fr-mb-3w${
              showAppError ? " fr-checkbox-group--error" : ""
            }`}
          >
            <input
              type="checkbox"
              id="app-installed"
              className="fr-checkbox-group__input"
              checked={appInstalled}
              onChange={e => {
                setAppInstalled(e.target.checked);
                if (e.target.checked) setShowAppError(false);
              }}
            />
            <label className="fr-label" htmlFor="app-installed">
              J'ai installé une application d'authentification sur mon
              smartphone
            </label>
            {showAppError && (
              <p className="fr-error-text">
                Merci de bien vouloir prendre connaissance et cocher la case
                pour continuer.
              </p>
            )}
          </div>

          <div className="fr-btns-group fr-btns-group--right fr-btns-group--inline">
            <Button priority="secondary" onClick={onClose}>
              Annuler
            </Button>
            <Button disabled={generating} onClick={goToQrCode}>
              Continuer
            </Button>
          </div>
        </div>
      )}

      {/* Étape 2 : QR code + saisie du code (fusionnés) */}
      {step === "qrcode" && (
        <div>
          <p className="fr-text--bold">
            Scannez ce QRcode avec votre application
          </p>

          {qrCodeUrl && (
            <div className="fr-mb-2w" style={{ textAlign: "center" }}>
              <QRCode value={qrCodeUrl} size={180} />
            </div>
          )}

          {/* Clé manuelle : lien toggle simple, pas d'Accordion */}
          {secret && (
            <div className="fr-mb-3w">
              <button
                type="button"
                className="fr-link"
                onClick={() => setShowManualKey(v => !v)}
                aria-expanded={showManualKey}
              >
                Vous ne pouvez pas scanner le code ?
              </button>
              {showManualKey && (
                <div className="fr-mt-1w fr-text--sm">
                  <p className="fr-mb-1w">
                    Pour configurer manuellement votre application
                    d'authentification mobile :
                  </p>
                  <p className="fr-mb-0">
                    <strong>Clé/secret :</strong>{" "}
                    <code style={{ wordBreak: "break-all" }}>{secret}</code>
                  </p>
                  <p className="fr-mb-0">
                    <strong>Type :</strong> TOTP
                  </p>
                  <p className="fr-mb-0">
                    <strong>Algorithme :</strong> SHA1
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Input avec état d'erreur DSFR natif */}
          <div className="fr-col-md-8">
            <Input
              label="Insérez le code généré par votre application"
              hintText="Entrez le code à usage unique"
              state={confirmError ? "error" : "default"}
              stateRelatedMessage={
                confirmError ? "Le code est incorrect" : undefined
              }
              nativeInputProps={{
                value: totpCode,
                onChange: e => {
                  setTotpCode(e.target.value);
                  // Efface l'erreur dès que l'utilisateur modifie le champ
                  if (confirmError) resetConfirmError();
                },
                inputMode: "numeric",
                pattern: "[0-9]*",
                maxLength: 6,
                autoComplete: "one-time-code",
                placeholder: "ex: 123456"
              }}
            />
          </div>

          <div className="fr-btns-group fr-btns-group--right fr-btns-group--inline fr-mt-3w">
            <Button priority="secondary" onClick={() => setStep("explanation")}>
              Précédent
            </Button>
            <Button
              disabled={totpCode.length !== 6 || confirming}
              onClick={handleConfirmCode}
            >
              Continuer
            </Button>
          </div>
        </div>
      )}

      {/* Étape 3 : Codes de récupération */}
      {step === "recovery" && (
        <div>
          <h3 className="fr-h6 fr-mb-1w">
            Sauvegardez vos clés de récupération
          </h3>
          <p className="fr-mb-3w">
            Ces clés sont le seul et unique moyen de récupérer votre compte si
            vous perdez votre téléphone. Nous vous conseillons fortement de les
            sauvegarder dans un document ou de les imprimer.
          </p>

          <div className="fr-mb-3w">
            <div
              className="fr-p-2w fr-mb-2w"
              style={{
                background: "#f6f6f6",
                borderRadius: 4,
                fontFamily: "monospace",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.5rem"
              }}
            >
              {recoveryCodes.map(code => (
                <span key={code} style={{ letterSpacing: "0.05em" }}>
                  {code}
                </span>
              ))}
            </div>
          </div>

          <ul className="fr-btns-group fr-btns-group--inline fr-mb-3w">
            <li>
              <Button
                priority="secondary"
                iconId="fr-icon-download-line"
                iconPosition="left"
                onClick={handleDownloadCodes}
              >
                Télécharger en .txt
              </Button>
            </li>
            <li>
              <Button
                priority="secondary"
                iconId={
                  copied ? "fr-icon-check-line" : "fr-icon-clipboard-line"
                }
                iconPosition="left"
                onClick={handleCopyCodes}
              >
                {copied ? "Copié !" : "Copier"}
              </Button>
            </li>
          </ul>

          {/* Checkbox avec validation au clic */}
          <div
            className={`fr-checkbox-group fr-mb-3w${
              showSavedError ? " fr-checkbox-group--error" : ""
            }`}
          >
            <input
              type="checkbox"
              id="saved-confirmed"
              className="fr-checkbox-group__input"
              checked={savedConfirmed}
              onChange={e => {
                setSavedConfirmed(e.target.checked);
                if (e.target.checked) setShowSavedError(false);
              }}
            />
            <label className="fr-label" htmlFor="saved-confirmed">
              J'ai sauvegardé mes clés de récupération
            </label>
            {showSavedError && (
              <p className="fr-error-text">
                Merci de bien vouloir prendre connaissance et cocher la case
                pour continuer.
              </p>
            )}
          </div>

          <div className="fr-btns-group fr-btns-group--right fr-btns-group--inline">
            <Button onClick={handleFinish}>Activer</Button>
          </div>
        </div>
      )}

      {/* Étape 4 : Confirmation */}
      {step === "success" && (
        <div>
          {/* Bannière succès compacte (pas de title séparé) */}
          <div className="fr-alert fr-alert--success fr-mb-3w" role="alert">
            <p>Votre double authentification est bien activée</p>
          </div>
          <div className="fr-btns-group fr-btns-group--right">
            <Button onClick={onSuccess}>Fermer</Button>
          </div>
        </div>
      )}
    </TdModal>
  );
}
