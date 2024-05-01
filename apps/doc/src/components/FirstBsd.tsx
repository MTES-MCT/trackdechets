import React from "react";
import { usePluginData } from "@docusaurus/useGlobalData";
import Tabs from "@theme/Tabs";
import TabItem from "@theme/TabItem";
import CodeBlock from "@theme/CodeBlock";
import { resolve } from "../utils";

const FirstBsd = () => {
  const { workflows } = usePluginData<any>("workflow-doc-plugin");
  const firstBsdd = resolve("bsdd.acheminementDirect", workflows).steps[0];

  return (
    <Tabs
      defaultValue="bsdd"
      values={[{ label: "Déchets dangereux", value: "bsdd" }]}
    >
      <TabItem value="bsdd">
        <p>Requête à utiliser dans le cadre en haut à gauche du playground :</p>
        <CodeBlock className="language-graphql">{firstBsdd.mutation}</CodeBlock>
        <p>
          Variables à ajouter dans l'onglet "Query Variables" du playground en
          remplaçant SIRET_PRODUCTEUR, SIRET_TRAITEUR et SIRET_TRANSPORTEUR. Au
          moins un de ces n°SIRET doit correspondre à un établissement dont vous
          faites partie.
        </p>
        <CodeBlock className="language-json">{firstBsdd.variables}</CodeBlock>
      </TabItem>
    </Tabs>
  );
};

export default FirstBsd;
