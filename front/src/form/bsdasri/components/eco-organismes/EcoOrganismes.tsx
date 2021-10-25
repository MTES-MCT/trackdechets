import { useQuery, gql } from "@apollo/client";
import { useField, useFormikContext } from "formik";
import React, { useState } from "react";
import CompanyResults from "../../../common/components/company/CompanyResults";
import styles from "./EcoOrganismes.module.scss";
import SearchInput from "common/components/SearchInput";
import {
  Query,
  EcoOrganisme,
  Bsdasri,
  BsdasriEcoOrganisme,
} from "../../../../generated/graphql/types";
import TdSwitch from "common/components/Switch";

const GET_ECO_ORGANISMES = gql`
  {
    ecoOrganismes {
      id
      name
      siret
      address
    }
  }
`;

export function getInitialEcoOrganisme(
  ecoOrganisme?: BsdasriEcoOrganisme | null
) {
  return {
    siret: ecoOrganisme?.siret ?? "",
    name: ecoOrganisme?.name ?? "",
  };
}

interface EcoOrganismesProps {
  name: string;
}
/**
 * First implementation of ecoOrganisme field
 * This will evole in the next future because ecoOrganisme expected behaviour on dasri slightly differs from bsd.
 */
export default function BsdasriEcoOrganismes(props: EcoOrganismesProps) {
  const [field] = useField<Bsdasri["ecoOrganisme"]>(props);
  const { setFieldValue } = useFormikContext<Bsdasri>();
  const [clue, setClue] = useState("");
  const { loading, error, data } = useQuery<Pick<Query, "ecoOrganismes">>(
    GET_ECO_ORGANISMES
  );

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
          label="Agit pour le compte de l'éco organisme agréé"
        />
      </div>

      {hasEcoOrganisme && (
        <>
          {loading && <p>Chargement...</p>}
          {error && <p>Erreur lors du chargement des éco-organismes...</p>}
          {data && (
            <>
              <div className="form__row notification notification--info">
                Veuillez sélectionner ci-dessous un des éco-organismes
                enregistrés dans Trackdéchets.
              </div>
              <SearchInput
                id="eco-search"
                placeholder="Filtrer les éco-organismes par nom..."
                className={styles.ecoorganismeSearchInput}
                onChange={event => setClue(event.target.value)}
              />
              <div className={styles.list}>
                <CompanyResults<EcoOrganisme>
                  onSelect={eo =>
                    setFieldValue(field.name, {
                      name: eo.name,
                      siret: eo.siret,
                    })
                  }
                  results={data.ecoOrganismes.filter(eo =>
                    eo.name.toLowerCase().includes(clue.toLowerCase())
                  )}
                  selectedItem={
                    data.ecoOrganismes.find(
                      eo => eo.siret === field.value?.siret
                    ) || null
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
