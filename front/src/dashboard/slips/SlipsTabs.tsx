import { useQuery } from "@apollo/react-hooks";
import React from "react";
import { FaClone } from "react-icons/fa";
import { Link } from "react-router-dom";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import { InlineError } from "../../common/Error";
import Loader from "../../common/Loader";
import { Me } from "../../login/model";
import { GET_SLIPS } from "./query";
import Slips from "./Slips";
import { getTabForms, SlipTabs } from "./slips-actions/next-step";
import "./SlipsTabs.scss";

type Props = { me: Me; siret: string };

export default function SlipsTabs({ me, siret }: Props) {
  const { loading, error, data } = useQuery(GET_SLIPS, {
    variables: { siret }
  });

  if (loading) return <Loader />;
  if (error) return <InlineError apolloError={error} />;
  if (!data) return <p>Aucune donnée à afficher</p>;

  const drafts = getTabForms(SlipTabs.DRAFTS, data.forms, siret);
  const toSign = getTabForms(SlipTabs.TO_SIGN, data.forms, siret);
  const status = getTabForms(SlipTabs.STATUS, data.forms, siret);
  const history = getTabForms(SlipTabs.HISTORY, data.forms, siret);

  return (
    <Tabs>
      <TabList>
        <Tab>Mes brouillons ({drafts.length})</Tab>
        <Tab>Agir sur mes bordereaux ({toSign.length})</Tab>
        <Tab>Suivre mes bordereaux ({status.length})</Tab>
        <Tab>Mes bordereaux archivés ({history.length})</Tab>
      </TabList>

      <TabPanel>
        {drafts.length ? (
          <Slips
            siret={siret}
            forms={drafts}
            hiddenFields={["status", "readableId"]}
            dynamicActions={true}
          />
        ) : (
          <div className="empty-tab">
            <img src="/illu/illu_empty.svg" alt="" />
            <h4>Il n'y a aucun bordereau en brouillon</h4>
            <p>
              Si vous le souhaitez, vous pouvez{" "}
              <Link to="/form">
                <button className="button-outline small primary">
                  créer un bordereau
                </button>
              </Link>{" "}
              ou dupliquer un bordereau déjà existant dans un autre onglet grâce
              à l'icône <FaClone />
            </p>
          </div>
        )}
      </TabPanel>
      <TabPanel>
        {toSign.length ? (
          <Slips siret={siret} forms={toSign} dynamicActions={true}/>
        ) : (
          <div className="empty-tab">
            <img src="/illu/illu_sent.svg" alt="" />
            <h4>Il n'y a aucun bordereau à signer</h4>
            <p>
              Bonne nouvelle, vous n'avez aucun bordereau à signer ! Des
              bordereaux apparaissent dans cet onglet uniquement lorsque vous
              avez une action à effectuer dans le cadre de leur cycle de vie
              (envoi, réception ou traitement...)
            </p>
          </div>
        )}
      </TabPanel>
      <TabPanel>
        {status.length ? (
          <Slips siret={siret} forms={status}  />
        ) : (
          <div className="empty-tab">
            <img src="/illu/illu_transfer.svg" alt="" />
            <h4>Il n'y a aucun bordereau à suivre</h4>
            <p>
              Des bordereaux apparaissent dans cet onglet lorsqu'ils sont en
              attente d'une action extérieure. Par exemple lorsqu'en tant que
              producteur vous attendez la réception d'un déchet ou son
              traitement. La colonne <strong>STATUT</strong> vous renseignera
              sur l'état précis du bordereau.
            </p>
          </div>
        )}
      </TabPanel>
      <TabPanel>
        {history.length ? (
          <Slips siret={siret} forms={history} />
        ) : (
          <div className="empty-tab">
            <img src="/illu/illu_hello.svg" alt="" />
            <h4>Il n'y a aucun bordereau en archive</h4>
            <p>
              Des bordereaux apparaissent dans cet onnglet lorsqu'ils terminé
              leur cycle de vie. Ils sont alors disponible en lecture seule pour
              consultation.
            </p>
          </div>
        )}
      </TabPanel>
    </Tabs>
  );
}
