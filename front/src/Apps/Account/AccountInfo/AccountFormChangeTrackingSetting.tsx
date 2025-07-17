import { useMutation } from "@apollo/client";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import { DsfrNotificationError } from "../../common/Components/Error/Error";
import { ToggleSwitch } from "@codegouvfr/react-dsfr/ToggleSwitch";
import AccountInfoActionBar from "./AccountInfoActionBar";

import { validationAccountTrackingConsentSchema } from "../accountSchema";
import { UPDATE_TRACKING_CONSENT } from "../../common/queries/user/userQueries";
import { useAuth } from "../../../common/contexts/AuthContext";

type ValidationSchema = z.infer<typeof validationAccountTrackingConsentSchema>;

interface FormFields {
  trackingConsent: boolean;
}

const labelText = `Aidez Trackdéchets à améliorer son service en permettant le recueil automatique des données d’utilisation.Ces données sont, par exemple, le parcours entre le différents écrans et les champs sélectionnés et l’ordre de remplissage de ceux-ci.`;

export default function AccountFormChangeTrackingSetting() {
  const [updateTrackingConsent, { loading, error }] = useMutation(
    UPDATE_TRACKING_CONSENT
  );
  const { refreshUser, user } = useAuth();

  const [isEditing, setIsEditing] = useState<boolean>(false);

  const defaultValues: FormFields = {
    trackingConsent: Boolean(user?.trackingConsent)
  };

  const { handleSubmit, reset, formState, setValue, watch } =
    useForm<ValidationSchema>({
      defaultValues,
      resolver: zodResolver(validationAccountTrackingConsentSchema)
    });

  const onReset = async () => {
    setIsEditing(false);
    reset();
    await refreshUser();
  };

  const onEditSetting = () => {
    setIsEditing(true);
  };

  const trackingConsent = watch("trackingConsent");

  const onSubmit: SubmitHandler<ValidationSchema> = async () => {
    await updateTrackingConsent({
      variables: { trackingConsent }
    });
    setIsEditing(false);
  };
  return (
    <div>
      {!isEditing && (
        <>
          <AccountInfoActionBar
            title="Analyse et améliorations"
            onEditInfo={onEditSetting}
            onReset={onReset}
            isEditing={isEditing}
          />

          <div className="fr-col-md-8 ">
            <ToggleSwitch
              label={labelText}
              checked={trackingConsent}
              onChange={() => null}
              style={{ cursor: "not-allowed" }}
            />
          </div>
        </>
      )}

      {isEditing && (
        <form onSubmit={handleSubmit(onSubmit)}>
          <AccountInfoActionBar
            title="Analyse et améliorations"
            onEditInfo={onEditSetting}
            onReset={onReset}
            isEditing={isEditing}
            isDisabled={formState.isSubmitting}
          />
          <div className="fr-col-md-8 ">
            <ToggleSwitch
              label={labelText}
              checked={trackingConsent}
              onChange={e => setValue("trackingConsent", e)}
            />
          </div>

          <AccountInfoActionBar
            onEditInfo={onEditSetting}
            onReset={async () => await onReset()}
            isEditing={isEditing}
            isDisabled={formState.isSubmitting}
          />

          {loading && <div>Envoi en cours...</div>}
          {error && <DsfrNotificationError apolloError={error} />}
        </form>
      )}
    </div>
  );
}
