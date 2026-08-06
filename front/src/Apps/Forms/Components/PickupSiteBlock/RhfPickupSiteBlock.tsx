import React from "react";
import { useFormContext } from "react-hook-form";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { ToggleSwitch } from "@codegouvfr/react-dsfr/ToggleSwitch";
import { requiredAria, requiredLabel } from "../RequiredField/requiredField";
import BsffPickupSiteAddress from "./BsffPickupSiteAddress";

export default function RhfPickupSiteBlock({
  disabled = false
}: {
  disabled?: boolean;
}) {
  const { register, setValue, watch, formState } = useFormContext();
  const enabled = !!watch("pickupSiteEnabled");
  const manual = !!watch("pickupSiteManualMode");
  const site = watch("emitter.pickupSite") ?? {};
  const errors = formState.errors?.emitter?.["pickupSite"];
  const set = (name: string, value: unknown) =>
    setValue(name, value, { shouldDirty: true, shouldValidate: true });
  return (
    <>
      <ToggleSwitch
        className="fr-mt-4w"
        label="Le lieu de collecte est différent de mon établissement"
        inputTitle="Lieu de collecte différent"
        checked={enabled}
        disabled={disabled}
        onChange={value => set("pickupSiteEnabled", value)}
      />
      {enabled && (
        <>
          <h4 className="fr-h4 fr-mt-4w">Adresse de chantier ou de collecte</h4>
          <Input
            label={requiredLabel("Nom du site d'enlèvement", true)}
            disabled={disabled}
            nativeInputProps={{
              ...register("emitter.pickupSite.name"),
              ...requiredAria(true)
            }}
            state={errors?.name ? "error" : "default"}
            stateRelatedMessage={errors?.name?.message as string}
          />
          <BsffPickupSiteAddress
            site={site}
            disabled={disabled}
            manual={manual}
            errors={errors}
            onManualChange={value => set("pickupSiteManualMode", value)}
            onChange={(field, value) =>
              set(`emitter.pickupSite.${field}`, value)
            }
          />
          {manual && (
            <Input
              label="Informations complémentaires"
              textArea
              disabled={disabled}
              nativeTextAreaProps={{
                ...register("emitter.pickupSite.infos"),
                ...requiredAria(false)
              }}
            />
          )}
        </>
      )}
    </>
  );
}
