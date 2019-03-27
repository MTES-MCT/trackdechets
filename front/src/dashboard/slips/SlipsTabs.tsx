import React from "react";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import "./SlipsTabs.scss";
import Slips from "./Slips";
import { GET_SLIPS } from "./query";
import { Query, QueryResult } from "react-apollo";
import { Me } from "../../login/model";
import { Form } from "../../form/model";
import { getNextStep } from "./slips-actions/next-step";
import { FaClone } from "react-icons/fa";
import { Link } from "react-router-dom";

type Props = { me: Me };
export default function SlipsTabs({ me }: Props) {
  return (
    <Query query={GET_SLIPS}>
      {({ loading, error, data }: QueryResult<{ forms: Form[] }>) => {
        if (loading) return "Chargement...";
        if (error || !data) return "Erreur...";

        const drafts = data.forms
          .filter((f: Form) => f.status === "DRAFT")
          .sort((a: any, b: any) => a.createdAt - b.createdAt);
        const toSign = data.forms
          .filter(
            (f: Form) => f.status !== "DRAFT" && getNextStep(f, me) != null
          )
          .sort((a: any, b: any) => a.status - b.status);
        const status = data.forms
          .filter(
            (f: Form) =>
              f.status !== "DRAFT" &&
              f.status !== "PROCESSED" &&
              getNextStep(f, me) == null
          )
          .sort((a: any, b: any) => a.status - b.status);
        const history = data.forms
          .filter((f: Form) => f.status === "PROCESSED")
          .sort((a: any, b: any) => a.createdAt - b.createdAt);

        return (
          <Tabs>
            <TabList>
              <Tab>Brouillons ({drafts.length})</Tab>
              <Tab>En attente de signature ({toSign.length})</Tab>
              <Tab>Statut du déchet ({status.length})</Tab>
              <Tab>Archives ({history.length})</Tab>
            </TabList>

            <TabPanel>
              {drafts.length ? (
                <Slips
                  me={me}
                  forms={drafts}
                  hiddenFields={["status", "readableId"]}
                />
              ) : (
                <div className="empty-tab">
                  <img src="/illu/illu_empty.svg" />
                  <h4>Il n'y a aucun bordereau en brouillon</h4>
                  <p>
                    Si vous le souhaitez, vous pouvez{" "}
                    <Link to="/form">
                      <button className="button-outline small primary">
                        créer un bordereau
                      </button>
                    </Link>{" "}
                    ou dupliquer un bordereau déjà existant dans un autre onglet
                    grâce à l'icône <FaClone />
                  </p>
                </div>
              )}
            </TabPanel>
            <TabPanel>
              {toSign.length ? (
                <Slips me={me} forms={toSign} />
              ) : (
                <div className="empty-tab">
                  <img src="/illu/illu_sent.svg" />
                  <h4>Il n'y a aucun bordereau à signer</h4>
                  <p>
                    Bonne nouvelle, vous n'avez aucun bordereau à signer ! Des
                    bordereaux apparaissent dans cet onglet uniquement lorsque
                    vous avez une action à effectuer dans le cadre de leur cycle
                    de vie (envoi, réception ou traitement...)
                  </p>
                </div>
              )}
            </TabPanel>
            <TabPanel>
              {status.length ? (
                <Slips me={me} forms={status} />
              ) : (
                <div className="empty-tab">
                  <img src="/illu/illu_transfer.svg" />
                  <h4>Il n'y a aucun bordereau à suivre</h4>
                  <p>
                    Des bordereaux apparaissent dans cet onglet lorsqu'ils sont
                    en attente d'une action extérieure. Par exemple lorsqu'en
                    tant que producteur vous attendez la réception d'un déchet
                    ou son traitement. La colonne <strong>STATUT</strong> vous
                    renseignera sur l'état précis du bordereau.
                  </p>
                </div>
              )}
            </TabPanel>
            <TabPanel>
              {history.length ? (
                <Slips me={me} forms={history} />
              ) : (
                <div className="empty-tab">
                  <img src="/illu/illu_hello.svg" />
                  <h4>Il n'y a aucun bordereau en archive</h4>
                  <p>
                    Des bordereaux apparaissent dans cet onnglet lorsqu'ils
                    terminé leur cycle de vie. Ils sont alors disponible en
                    lecture seule pour consultation.
                  </p>
                </div>
              )}
            </TabPanel>
          </Tabs>
        );
      }}
    </Query>
  );
}
