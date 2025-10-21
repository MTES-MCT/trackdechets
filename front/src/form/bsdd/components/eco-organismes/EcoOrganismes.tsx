import { useQuery, gql } from "@apollo/client";
import { useField, useFormikContext } from "formik";
import React, { useState } from "react";
import CompanyResults from "../../../common/components/company/CompanyResults";
import styles from "./EcoOrganismes.module.scss";
import SearchInput from "../../../../common/components/SearchInput";
import { Query, EcoOrganisme, Form } from "@td/codegen-ui";
import TdSwitch from "../../../../common/components/Switch";
import { getInitialEcoOrganisme } from "../../utils/initial-state";
import { capitalize } from "../.../../../../../common/helper";

const GET_ECO_ORGANISMES = gql`
  {
    ecoOrganismes(handleBsdd: true) {
      id
      name
      siret
      address
    }
  }
`;

interface EcoOrganismesProps {
  name: string;
  disabled: boolean;
}

export default function EcoOrganismes(props: EcoOrganismesProps) {
  const [field] = useField<Form["ecoOrganisme"]>(props);
  const { setFieldValue } = useFormikContext<Form>();
  const [clue, setClue] = useState("");
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
          disabled={props.disabled}
        />
      </div>

      {hasEcoOrganisme && (
        <>
          {loading && <p>Chargement...</p>}
          {error && <p>Erreur lors du chargement des éco-organismes...</p>}
          {data && (
            <>
              <div className="fr-alert fr-alert--info fr-mt-2w fr-mb-2w">
                <p>
                  Veuillez sélectionner dans la liste ci-dessous l’éco-organisme
                  inscrit sur Trackdéchets que vous souhaitez indiquer sur le
                  bordereau. Si un éco-organisme est renseigné, il prend la
                  responsabilité du déchet. Si l’éco-organisme recherché ne
                  figure pas dans la liste et que vous pensez qu’il s’agit d’une
                  erreur,{" "}
                  <a
                    href="https://faq.trackdechets.fr/pour-aller-plus-loin/assistance"
                    className="fr-link force-external-link-content force-underline-link"
                    target="_blank"
                    rel="noreferrer"
                  >
                    contactez le support
                  </a>
                  .
                </p>
              </div>
              <SearchInput
                id="eco-search"
                placeholder="Filtrer les éco-organismes par nom..."
                className={styles.ecoorganismeSearchInput}
                onChange={event => setClue(event.target.value)}
              />
              <div className={styles.list}>
                <CompanyResults<EcoOrganisme & { orgId: string }>
                  onSelect={eo =>
                    setFieldValue(field.name, {
                      name: eo.name,
                      siret: eo.siret
                    })
                  }
                  results={data.ecoOrganismes
                    .filter(eo =>
                      eo.name.toLowerCase().includes(clue.toLowerCase())
                    )
                    .map(eo => ({
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
