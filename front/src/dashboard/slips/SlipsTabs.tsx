import React from "react";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import "react-tabs/style/react-tabs.css";
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
              <Tab>Déchets émis</Tab>
              <Tab>Déchets reçus</Tab>
            </TabList>

            <TabPanel>
              <Slips
                me={me}
                forms={data.forms.filter((f: Form) => f.status === "DRAFT")}
              />
            </TabPanel>
            <TabPanel>
              <Slips
                me={me}
                forms={data.forms.filter(
                  (f: Form) =>
                    f.emitter.company.siret === me.company.siret &&
                    f.status !== "DRAFT"
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
