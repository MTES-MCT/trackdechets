import Alert from "@codegouvfr/react-dsfr/Alert";
import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import React from "react";
import { useFormContext } from "react-hook-form";
import { AdminRequestValidationMethod } from "./CompanyCreateAdminRequestModalStep2";

const ADMINS_WARNED_ALERT =
  "Les administrateurs même inactifs sont prévenus de la demande.";
const VALIDATOR_CONTACTED_AFTER_24H =
  "La personne pouvant valider sera prévenue au bout de 24h.";
const MAIL_SENT =
  "Un courrier postal sera envoyé à l'adresse du siège de votre établissement. Il contiendra un code d'activation que vous devrez saisir dans la gestion avancée.";

export const CompanyCreateAdminRequestModalStep3 = () => {
  const { watch } = useFormContext();

  const validationMethod = watch("validationMethod");

  return (
    <>
      {validationMethod === AdminRequestValidationMethod.REQUEST_ADMIN_APPROVAL && (
        <Alert
          className="fr-mb-3w"
          small
          description={ADMINS_WARNED_ALERT}
          severity="info"
        />
      )}

      {validationMethod === AdminRequestValidationMethod.REQUEST_COLLABORATOR_APPROVAL && (
        <Alert
          className="fr-mb-3w"
          small
          description={
            ADMINS_WARNED_ALERT + " " + VALIDATOR_CONTACTED_AFTER_24H
          }
          severity="info"
        />
      )}

      {validationMethod === AdminRequestValidationMethod.SEND_MAIL && (
        <Alert
          className="fr-mb-3w"
          small
          description={MAIL_SENT}
          severity="warning"
        />
      )}

      <Checkbox
        options={[
          {
            label: "Je confirme demander les droits administrateur",
            nativeInputProps: {
              // ...register("emitter.irregularSituation"),
              // onChange: e => {
              //   setValue(
              //     "emitter.irregularSituation",
              //     e.currentTarget.checked
              //   );
              //   if (!e.currentTarget.checked) {
              //     setValue("emitter.noSiret", false);
              //   } else {
              //     if (emitter.agrementNumber) {
              //       setValue("emitter.agrementNumber", "");
              //     }
              //   }
              // }
            }
          }
        ]}
        // disabled={sealedFields.includes(`emitter.irregularSituation`)}
      />
    </>
  );
};
