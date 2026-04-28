import React, { useState } from "react";
import { gql, useMutation } from "@apollo/client";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import TdModal from "../../common/Components/Modal/Modal";

const DISABLE_TOTP = gql`
  mutation DisableTotp($code: String!) {
    disableTotp(code: $code) {
      id
      totpEnabled
    }
  }
`;

type Props = {
  onSuccess: () => void;
  onClose: () => void;
};

export default function DisableTotpModal({ onSuccess, onClose }: Props) {
  const [code, setCode] = useState("");
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);

  const [disableTotp, { loading, error, reset }] = useMutation(DISABLE_TOTP);

  const handleCodeChange = (value: string) => {
    setCode(value);
    if (error) reset();
  };

  const handleDisable = async () => {
    const { data } = await disableTotp({ variables: { code } });
    if (data?.disableTotp) {
      onSuccess();
    }
  };

  const title = "Voulez-vous vraiment désactiver l'authentification TOTP ?";

  const isCodeReady = useRecoveryCode
    ? code.trim().length > 0
    : code.length === 6;

  return (
    <TdModal isOpen onClose={onClose} ariaLabel={title} title={title} size="L">
      <p className="fr-mb-3w">
        La désactivation de l'authentification TOTP entraîne une baisse de la
        protection de votre compte.
      </p>

      <label className="fr-label fr-mb-1w">
        {useRecoveryCode
          ? "Insérez un code de récupération"
          : "Insérez le code généré par votre application"}
      </label>

      <Input
        label={
          useRecoveryCode
            ? "Entrez votre code de récupération"
            : "Entrez le code à usage unique"
        }
        state={error ? "error" : "default"}
        stateRelatedMessage={error ? "Le code est invalide" : undefined}
        nativeInputProps={{
          value: code,
          type: "password",
          onChange: e => handleCodeChange(e.target.value),
          ...(useRecoveryCode
            ? {
                autoComplete: "off"
              }
            : {
                maxLength: 6,
                autoComplete: "one-time-code"
              })
        }}
      />

      <button
        type="button"
        className="fr-link fr-mb-3w"
        onClick={() => {
          setUseRecoveryCode(v => !v);
          setCode("");
          if (error) reset();
        }}
      >
        {useRecoveryCode
          ? "Utiliser le code de mon application"
          : "Je n'ai pas accès à l'application"}
      </button>

      <div className="fr-btns-group fr-btns-group--right fr-btns-group--inline fr-mt-3w">
        <Button priority="secondary" onClick={onClose} disabled={loading}>
          Ne pas désactiver
        </Button>
        <Button onClick={handleDisable} disabled={!isCodeReady || loading}>
          Désactiver
        </Button>
      </div>
    </TdModal>
  );
}
