import { gql, useQuery } from "@apollo/client";
import { BsdaEcoOrganisme, EcoOrganisme, Query } from "@td/codegen-ui";
import React, { useState } from "react";
import { useFormContext } from "react-hook-form";
import CompanyResults from "../../../../../form/common/components/company/CompanyResults";
import ToggleSwitch from "@codegouvfr/react-dsfr/ToggleSwitch";

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

type EcoOrganismeWithOrgId = EcoOrganisme & {
  orgId: string;
};

export default function DsfrBsdaEcoOrganismes() {
  const { setValue, watch } = useFormContext();

  const { loading, error, data } =
    useQuery<Pick<Query, "ecoOrganismes">>(GET_ECO_ORGANISMES);

  const ecoOrganisme = watch("ecoOrganisme");

  const [hasEcoOrganisme, setHasEcoOrganisme] = useState(ecoOrganisme !== null);

  function handleEcoOrganismeToggle() {
    if (hasEcoOrganisme) {
      setHasEcoOrganisme(false);
      setValue("ecoOrganisme", null);
    } else {
      setHasEcoOrganisme(true);
    }
  }
  return (
    <div className="form__row">
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
            <div className="tw-overflow-auto my-6">
              <CompanyResults<EcoOrganismeWithOrgId>
                onSelect={eo =>
                  setValue("ecoOrganisme", {
                    name: eo.name,
                    siret: eo.siret,
                    orgId: eo.orgId
                  })
                }
                results={data.ecoOrganismes.map(eo => ({
                  ...eo,
                  orgId: eo.siret
                }))}
                selectedItem={
                  data.ecoOrganismes
                    .map(eo => ({
                      ...eo,
                      orgId: eo.siret
                    }))
                    .find(eo => eo.siret === ecoOrganisme?.siret) || null
                }
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
