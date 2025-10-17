import { useQuery, gql } from "@apollo/client";
import { useField, useFormikContext } from "formik";
import React from "react";
import CompanyResults from "../../../common/components/company/CompanyResults";
import styles from "./EcoOrganismes.module.scss";
import {
  Query,
  EcoOrganisme,
  Bsdasri,
  BsdasriEcoOrganisme
} from "@td/codegen-ui";
import TdSwitch from "../../../../common/components/Switch";
import { capitalize } from "../../../../common/helper";

const GET_ECO_ORGANISMES = gql`
  {
    ecoOrganismes(handleBsdasri: true) {
      id
      name
      siret
      address
      handleBsdasri
    }
  }
`;

export function getInitialEcoOrganisme(
  ecoOrganisme?: BsdasriEcoOrganisme | null
) {
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
/**
 * First implementation of ecoOrganisme field
 * This will evole in the next future because ecoOrganisme expected behaviour on dasri slightly differs from bsd.
 */
export default function BsdasriEcoOrganismes(props: EcoOrganismesProps) {
  const [field] = useField<Bsdasri["ecoOrganisme"]>(props);
  const { setFieldValue } = useFormikContext<Bsdasri>();

  const { loading, error, data } =
    useQuery<Pick<Query, "ecoOrganismes">>(GET_ECO_ORGANISMES);

  const hasEcoOrganisme = !!field.value;
  function handleEcoOrganismeToggle() {
    if (hasEcoOrganisme) {
      setFieldValue(field.name, null, false);
    } else {
      setFieldValue(field.name, getInitialEcoOrganisme(), false);
    }
  }
  return (
    <>
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
            <>
              <div className="form__row notification notification--info">
                Veuillez sélectionner ci-dessous l'éco-organisme agréé pour la
                gestion des dasris.
              </div>

              <div className={styles.list}>
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
                    orgId: eo.siret,
                    name: capitalize(eo.name) as string
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
            </>
          )}
        </>
      )}
    </>
  );
}
