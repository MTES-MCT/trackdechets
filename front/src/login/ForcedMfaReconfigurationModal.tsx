import React from "react";
import { gql, useMutation } from "@apollo/client";
import TotpSetupWizard from "../Apps/Account/AccountAuthentication/TotpSetupWizard";

const COMPLETE_MFA_RECONFIGURATION = gql`
  mutation CompleteMfaReconfiguration {
    completeMfaReconfiguration {
      id
      mustReconfigureMfa
    }
  }
`;

type Props = {
  onComplete: () => void;
};

/**
 * Affiche le parcours de reconfiguration MFA obligatoire.
 * Bloque l'accès à la plateforme tant que la reconfiguration n'est pas terminée.
 * Réutilise TotpSetupWizard (configuration TOTP + codes de récupération).
 * Appelé depuis RequireAuth quand mustReconfigureMfa = true.
 */
export default function ForcedMfaReconfigurationModal({ onComplete }: Props) {
  const [completeMfaReconfiguration] = useMutation(
    COMPLETE_MFA_RECONFIGURATION
  );

  const handleSuccess = async () => {
    await completeMfaReconfiguration();
    onComplete();
  };

  return (
    <TotpSetupWizard
      onSuccess={handleSuccess}
      // La modale ne peut pas être fermée : la reconfiguration est obligatoire
      onClose={() => undefined}
    />
  );
}
