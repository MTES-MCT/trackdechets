import React from "react";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import "./SlipsTabs.scss";
import Slips from "./Slips";
import { GET_SLIPS } from "./query";
import { Query, QueryResult } from "react-apollo";
import { Me } from "../../login/model";
import { Form } from "../../form/model";
import { getNextStep } from "./slips-actions/next-step";

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
            (f: Form) => f.status !== "DRAFT" && getNextStep(f, me) == null
          )
          .sort((a: any, b: any) => a.status - b.status);

        return (
          <Tabs>
            <TabList>
              <Tab>Brouillons</Tab>
              <Tab>En attente de signature</Tab>
              <Tab>Statut du déchet</Tab>
            </TabList>

            <TabPanel>
              <Slips me={me} forms={drafts} showStatus={false} />
            </TabPanel>
            <TabPanel>
              <Slips me={me} forms={toSign} />
            </TabPanel>
            <TabPanel>
              <Slips me={me} forms={status} />
            </TabPanel>
          </Tabs>
        );
      }}
    </Query>
  );
}
