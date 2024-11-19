import React, { useEffect, useState, useContext } from "react";
import { ToggleSwitch } from "@codegouvfr/react-dsfr/ToggleSwitch";
import { useFormContext } from "react-hook-form";
import Select from "@codegouvfr/react-dsfr/Select";
import { ZodBsvhu } from "../schema";
import { ecoOrganismeList } from "../utils/initial-state";
import { BsvhuEcoOrganismeInput } from "@td/codegen-ui";
import { SealedFieldsContext } from "../../../../Dashboard/Creation/context";

const EcoOrganism = () => {
  const [selectedEcoOrg, setSelectedEcoOrg] =
    useState<BsvhuEcoOrganismeInput>();
  const { register, watch, setValue, formState, clearErrors } =
    useFormContext<ZodBsvhu>(); // retrieve all hook methods
  const sealedFields = useContext(SealedFieldsContext);

  const ecoOrganisme = watch("ecoOrganisme");
  const hasEcoOrganisme = ecoOrganisme.hasEcoOrganisme;

  const onChangeEcoOrganisme = e => {
    const ecoOrgSelected = ecoOrganismeList.find(
      ecoOrg => ecoOrg.siret === e.currentTarget.value
    );
    if (ecoOrgSelected?.name) {
      clearErrors("ecoOrganisme.siret");
      setSelectedEcoOrg(ecoOrgSelected);
      setValue("ecoOrganisme.name", ecoOrgSelected.name);
    } else {
      setSelectedEcoOrg(undefined);
      setValue("ecoOrganisme.siret", "");
      setValue("ecoOrganisme.name", "");
    }
  };

  const onToggleEcoOrganisme = checked => {
    if (checked) {
      setValue("ecoOrganisme.hasEcoOrganisme", true);
    } else {
      setValue("ecoOrganisme.siret", "");
      setValue("ecoOrganisme.name", "");
      setValue("ecoOrganisme.hasEcoOrganisme", false);
    }
  };

  useEffect(() => {
    if (ecoOrganisme?.siret && !hasEcoOrganisme) {
      setValue("ecoOrganisme.hasEcoOrganisme", true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <h4 className="fr-h4">Éco-organisme</h4>

      <ToggleSwitch
        label="Présence d'un éco-organisme"
        checked={!!hasEcoOrganisme}
        showCheckedHint={false}
        onChange={onToggleEcoOrganisme}
        disabled={sealedFields.includes(`ecoOrganisme.siret`)}
      />

      {hasEcoOrganisme && (
        <>
          <Select
            label="Nom de l'éco-organisme"
            nativeSelectProps={{
              ...register("ecoOrganisme.siret"),
              onChange: onChangeEcoOrganisme
            }}
            state={formState.errors.ecoOrganisme?.siret && "error"}
            stateRelatedMessage={formState.errors.ecoOrganisme?.siret?.message}
            disabled={sealedFields.includes(`ecoOrganisme.siret`)}
            className="fr-mt-2w"
          >
            <option value="">Sélectionner un éco-organisme</option>

            {ecoOrganismeList?.map(ecoOrg => {
              return (
                <option
                  key={ecoOrg.siret}
                  value={ecoOrg.siret}
                  defaultValue={ecoOrganisme?.siret || ""}
                >
                  {`${ecoOrg.siret} - ${ecoOrg.name}`}
                </option>
              );
            })}
          </Select>

          <input
            hidden
            value={selectedEcoOrg?.name || ""}
            defaultValue={ecoOrganisme?.name || ""}
            {...register("ecoOrganisme.name")}
          />
        </>
      )}
    </>
  );
};

export default EcoOrganism;
