import Alert from "@codegouvfr/react-dsfr/Alert";
import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import React, { useState } from "react";
import { useFormContext } from "react-hook-form";
import { AdminRequestValidationMethod } from "@td/codegen-ui";

const ADMINS_WARNED_ALERT =
  "Les administrateurs même inactifs sont prévenus de la demande.";
const VALIDATOR_CONTACTED_AFTER_24H =
  "La personne pouvant valider sera prévenue au bout de 24h.";
const MAIL_SENT =
  "Un courrier postal sera envoyé à l'adresse du siège de l'établissement. Il contiendra un code de vérification que vous devrez saisir dans la gestion avancée.";

export const CompanyCreateAdminRequestModalStep3 = ({
  onSubmit,
  onClickPrevious,
  loading,
  error
}) => {
  const { watch } = useFormContext();
  const [hasConfirmed, setHasConfirmed] = useState(false);

  const validationMethod = watch("validationMethod");
  const companyName = watch("companyName");
  const companyOrgId = watch("companyOrgId");
  const collaboratorEmail = watch("collaboratorEmail");

  return (
    <>
      <div className="fr-mb-2w">
        <ul className="fr-ml-2w" style={{ listStyleType: "disc" }}>
          {companyName && companyOrgId && (
            <li>
              Établissement concerné: {companyName} - {companyOrgId}
            </li>
          )}
          {collaboratorEmail && (
            <li>Collaborateur pouvant valider: {collaboratorEmail}</li>
          )}
        </ul>
      </div>

      <div>
        {validationMethod ===
          AdminRequestValidationMethod.RequestAdminApproval && (
          <Alert
            className="fr-mb-3w"
            small
            description={ADMINS_WARNED_ALERT}
            severity="info"
          />
        )}

        {validationMethod ===
          AdminRequestValidationMethod.RequestCollaboratorApproval && (
          <Alert
            className="fr-mb-3w"
            small
            description={
              ADMINS_WARNED_ALERT + " " + VALIDATOR_CONTACTED_AFTER_24H
            }
            severity="info"
          />
        )}

        {validationMethod === AdminRequestValidationMethod.SendMail && (
          <Alert
            className="fr-mb-3w"
            small
            description={MAIL_SENT}
            severity="warning"
          />
        )}
      </div>

      <div>
        <Checkbox
          style={{ fontWeight: "bold" }}
          options={[
            {
              label: "Je confirme demander les droits administrateur",
              nativeInputProps: {
                onChange: e => {
                  setHasConfirmed(e.currentTarget.checked);
                }
              }
            }
          ]}
        />
      </div>

      <div>
        {error && (
          <Alert
            className="fr-mt-3w"
            small
            description={error}
            severity="error"
          />
        )}
      </div>

      <div className="td-modal-actions">
        <button className="fr-btn" onClick={onClickPrevious}>
          Retour
        </button>
        <button
          className="fr-btn"
          onClick={onSubmit}
          disabled={!hasConfirmed || loading}
        >
          Envoyer la demande
        </button>
      </div>
    </>
  );
};
