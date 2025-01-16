import { useQuery, gql } from "@apollo/client";
import { useField, useFormikContext } from "formik";
import React from "react";
import CompanyResults from "../../../common/components/company/CompanyResults";
import { Query, EcoOrganisme, Bsda, BsdaEcoOrganisme } from "@td/codegen-ui";
import TdSwitch from "../../../../common/components/Switch";

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

interface EcoOrganismesProps {
  name: string;
}

type EcoOrganismeWithOrgId = EcoOrganisme & {
  orgId: string;
};

export default function BsdaEcoOrganismes(props: EcoOrganismesProps) {
  const [field] = useField<Bsda["ecoOrganisme"]>(props);
  const { setFieldValue } = useFormikContext<Bsda>();

  const { loading, error, data } =
    useQuery<Pick<Query, "ecoOrganismes">>(GET_ECO_ORGANISMES);

  const hasEcoOrganisme = field.value != null;
  function handleEcoOrganismeToggle() {
    if (hasEcoOrganisme) {
      setFieldValue(field.name, null, false);
    } else {
      setFieldValue(field.name, getInitialEcoOrganisme(), false);
    }
  }
  return (
    <div className="form__row">
      <h4 className="form__section-heading">Eco-organisme</h4>
      <div className="form__row">
        <TdSwitch
          checked={hasEcoOrganisme}
          onChange={handleEcoOrganismeToggle}
          label="Un éco-organisme est responsable de la prise en charge des déchets"
        />
      </div>

      {hasEcoOrganisme && (
        <>
          {loading && <p>Chargement...</p>}
          {error && <p>Erreur lors du chargement des éco-organismes...</p>}
          {data && (
            <div className="tw-overflow-auto my-6">
              <CompanyResults<EcoOrganismeWithOrgId>
                onSelect={eo =>
                  setFieldValue(field.name, {
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
                    .find(eo => eo.siret === field.value?.siret) || null
                }
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
