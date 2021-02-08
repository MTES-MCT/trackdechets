import { useQuery, gql } from "@apollo/client";
import { useField, useFormikContext } from "formik";
import React, { useEffect, useState } from "react";
import CompanyResults from "../company/CompanyResults";
import styles from "./EcoOrganismes.module.scss";
import SearchInput from "common/components/SearchInput";
import { Query, EcoOrganisme, Form } from "../../generated/graphql/types";
import TdSwitch from "common/components/Switch";
import { tdContactEmail } from "common/config";
import { initialEcoOrganisme } from "form/initial-state";

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

interface EcoOrganismesProps {
  name: string;
}

export default function EcoOrganismes(props: EcoOrganismesProps) {
  const [field] = useField<Form["ecoOrganisme"]>(props);
  const { setFieldValue } = useFormikContext<Form>();
  const [isChecked, setIsChecked] = useState(Boolean(field.value?.siret));
  const [clue, setClue] = useState("");
  const { loading, error, data } = useQuery<Pick<Query, "ecoOrganismes">>(
    GET_ECO_ORGANISMES
  );

  useEffect(() => {
    // set initial value for ecoOrganisme when the switch is toggled
    if (isChecked && !field.value) {
      setFieldValue(field.name, initialEcoOrganisme, false);
    }

    // set ecoOrganisme to null when the switch is toggled off
    if (!isChecked && field.value) {
      setFieldValue(field.name, null, false);
    }
  }, [isChecked, field, setFieldValue]);

  return (
    <>
      <div className="form__row">
        <TdSwitch
          checked={isChecked}
          onChange={checked => setIsChecked(checked)}
          label="Un éco-organisme est le responsable / producteur des déchets de ce bordereau"
        />
      </div>

      {isChecked && (
        <>
          {loading && <p>Chargement...</p>}
          {error && <p>Erreur lors du chargement des éco-organismes...</p>}
          {data && (
            <>
              <div className="form__row notification notification--info">
                Veuillez sélectionner ci-dessous un des éco-organismes
                enregistrés dans Trackdéchets. Si votre éco-organisme n'apparait
                pas et que vous pensez que c'est une erreur,{" "}
                <a href={`mailto:${tdContactEmail}`} className="link">
                  contactez le support.
                </a>
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

          <div className="notification warning">
            Indiquez dans la partie <strong>"Entreprise émettrice"</strong>{" "}
            ci-dessous l'entreprise du lieu de collecte et son SIRET.
            L'Eco-organisme est bien identifié comme responsable du déchet.
            <br />
            Vous pouvez utiliser la case <strong>
              Adresse de chantier
            </strong>{" "}
            tout en bas si le lieu réel de collecte est différent de l'adresse
            de l'entreprise (exemple SIRET / adresse communauté de communes pour
            l'entreprise émettrice, et adresse dechetterie pour lieu de
            collecte.)
          </div>
        </>
      )}
    </>
  );
}
