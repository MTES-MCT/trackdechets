import { useQuery, gql } from "@apollo/client";
import { useField, useFormikContext } from "formik";
import React, { useState } from "react";
import CompanyResults from "../../../common/components/company/CompanyResults";
import styles from "./EcoOrganismes.module.scss";
import SearchInput from "../../../../common/components/SearchInput";
import { Query, EcoOrganisme, Form } from "@td/codegen-ui";
import TdSwitch from "../../../../common/components/Switch";
import { getInitialEcoOrganisme } from "../../utils/initial-state";

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
              <div className="form__row notification notification--info">
                Veuillez sélectionner ci-dessous un des éco-organismes
                enregistrés dans Trackdéchets. Si votre éco-organisme n'apparait
                pas et que vous pensez que c'est une erreur,{" "}
                <a
                  href="https://faq.trackdechets.fr/pour-aller-plus-loin/assistance"
                  target="_blank"
                  rel="noreferrer"
                >
                  contactez le support
                </a>
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
            </>
          )}
          <div className="notification warning">
            Si l'éco-organisme a bien été renseigné, il prend la responsabilité
            du déchet.
            <br />
            Indiquez dans la partie <strong>Entreprise émettrice</strong>{" "}
            ci-dessous l'entreprise qui est le producteur du déchet en
            renseignant le SIRET.
            <br />
            Si l'adresse de collecte / chantier est différente de celle du
            producteur, vous pouvez utiliser les champs{" "}
            <strong>Adresse chantier</strong> en bas de page.
            <br />
            L'éco-organisme ne doit pas être mentionné à la place de l'émetteur.
          </div>
        </>
      )}
    </>
  );
}
