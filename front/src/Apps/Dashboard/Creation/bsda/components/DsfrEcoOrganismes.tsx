import { gql, useQuery } from "@apollo/client";
import { BsdaEcoOrganisme, Query } from "@td/codegen-ui";
import React, { useState, useContext } from "react";
import { useFormContext } from "react-hook-form";
import ToggleSwitch from "@codegouvfr/react-dsfr/ToggleSwitch";
import Select from "@codegouvfr/react-dsfr/Select";
import { SealedFieldsContext } from "../../../../Dashboard/Creation/context";
import { capitalize } from "../../../../../common/helper";

const GET_ECO_ORGANISMES = gql`
  {
    ecoOrganismes(handleBsda: true) {
      id
      name
      siret
      address
      handleBsda
    }
  }
`;

export function getInitialEcoOrganisme(ecoOrganisme?: BsdaEcoOrganisme | null) {
  return {
    siret: ecoOrganisme?.siret ?? "",
    name: ecoOrganisme?.name ?? ""
  };
}

export default function DsfrBsdaEcoOrganismes() {
  const { setValue, watch, register, clearErrors, formState } =
    useFormContext();

  const sealedFields = useContext(SealedFieldsContext);

  const { loading, error, data } =
    useQuery<Pick<Query, "ecoOrganismes">>(GET_ECO_ORGANISMES);

  const ecoOrganisme = watch("ecoOrganisme");

  const [hasEcoOrganisme, setHasEcoOrganisme] = useState(ecoOrganisme !== null);

  const onChangeEcoOrganisme = e => {
    const ecoOrgSelected = data?.ecoOrganismes.find(
      ecoOrg => ecoOrg.siret === e.currentTarget.value
    );
    if (ecoOrgSelected?.name) {
      clearErrors("ecoOrganisme.siret");
      setValue("ecoOrganisme.name", ecoOrgSelected.name);
    } else {
      setValue("ecoOrganisme.siret", "");
      setValue("ecoOrganisme.name", "");
    }
  };

  function handleEcoOrganismeToggle() {
    if (hasEcoOrganisme) {
      setHasEcoOrganisme(false);
      setValue("ecoOrganisme", null);
    } else {
      setHasEcoOrganisme(true);
    }
  }
  return (
    <>
      <h4 className="fr-h4">Éco-organisme</h4>
      <ToggleSwitch
        checked={hasEcoOrganisme}
        onChange={handleEcoOrganismeToggle}
        inputTitle="ecoOrganisme"
        label="Un éco-organisme est responsable de la prise en charge des déchets"
        showCheckedHint={false}
      />

      {hasEcoOrganisme && (
        <>
          {loading && <p>Chargement...</p>}
          {error && <p>Erreur lors du chargement des éco-organismes...</p>}
          {data && (
            <Select
              label="Nom de l'éco-organisme"
              nativeSelectProps={{
                ...register("ecoOrganisme.siret"),
                onChange: onChangeEcoOrganisme
              }}
              state={formState.errors.ecoOrganisme?.["siret"] && "error"}
              stateRelatedMessage={
                formState.errors.ecoOrganisme?.["siret"]?.message
              }
              disabled={sealedFields.includes(`ecoOrganisme.siret`)}
              className="fr-mt-2w"
            >
              <option value="">Sélectionner un éco-organisme</option>

              {data?.ecoOrganismes
                ?.map(ecoOrg => {
                  return (
                    <option
                      key={ecoOrg.siret}
                      value={ecoOrg.siret}
                      defaultValue={ecoOrganisme?.siret || ""}
                    >
                      {`${ecoOrg.siret} - ${capitalize(ecoOrg.name)}`}
                    </option>
                  );
                })
                .filter(Boolean)}
            </Select>
          )}
        </>
      )}
    </>
  );
}
