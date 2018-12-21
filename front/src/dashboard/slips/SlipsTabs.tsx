import React from "react";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import "./SlipsTabs.scss";
import Slips from "./Slips";
import { GET_SLIPS } from "./query";
import { Query } from "react-apollo";
import { Me } from "../../login/model";
import { Form } from "../../form/model";

type Props = { me: Me };

export default function SlipsTabs({ me }: Props) {
  return (
    <Query query={GET_SLIPS}>
      {({ loading, error, data }) => {
        if (loading) return "Chargement...";
        if (error) return "Erreur...";

        return (
          <Tabs>
            <TabList>
              <Tab>Brouillons</Tab>
              <Tab>Produits</Tab>
              <Tab>Collectés / Traités</Tab>
            </TabList>

            <TabPanel>
              <Slips
                me={me}
                forms={data.forms.filter((f: Form) => f.status === "DRAFT")}
              />
            </TabPanel>
            <TabPanel>
              <h4>Déchets prêts à être envoyés</h4>
              <Slips
                me={me}
                forms={data.forms.filter(
                  (f: Form) =>
                    f.emitter.company.siret === me.company.siret &&
                    f.status === "SEALED"
                )}
              />
              <h4>Déchets déjà émis</h4>
              <Slips
                me={me}
                forms={data.forms.filter(
                  (f: Form) =>
                    f.emitter.company.siret === me.company.siret &&
                    ["DRAFT", "SEALED"].indexOf(f.status) === -1
                )}
              />
            </TabPanel>
            <TabPanel>
              <Slips
                me={me}
                forms={data.forms.filter(
                  (f: Form) =>
                    f.recipient.company.siret === me.company.siret &&
                    f.status !== "DRAFT"
                )}
              />
            </TabPanel>
          </Tabs>
        );
      }}
    </Query>
  );
}
