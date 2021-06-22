import React from "react";
import { usePluginData } from "@docusaurus/useGlobalData";
import Tabs from "@theme/Tabs";
import TabItem from "@theme/TabItem";
import CodeBlock from "@theme/CodeBlock";
import { resolve } from "../utils";

const FirstBsd = () => {
  const { workflows } = usePluginData("workflow-doc-plugin");
  const firstBsdd = resolve("bsdd.acheminementDirect", workflows).steps[0];

  return (
    <Tabs
      defaultValue="bsdd"
      values={[{ label: "Déchets dangereux", value: "bsdd" }]}
    >
      <TabItem value="bsdd">
        <CodeBlock className="graphql">{firstBsdd.mutation}</CodeBlock>
      </TabItem>
    </Tabs>
  );
};

export default FirstBsd;
