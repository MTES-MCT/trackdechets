import React from "react";
import { usePluginData } from "@docusaurus/useGlobalData";
import CodeBlock from "@theme/CodeBlock";
import Mermaid from "./Mermaid";
import { resolve } from "../utils";

export default function Workflow({ path }) {
  const { workflows } = usePluginData<any>("workflow-doc-plugin");
  const workflow = resolve(path, workflows);
  return (
    <div>
      {workflow.description && <div>{workflow.description}</div>}
      {workflow.chart && <Mermaid chart={workflow.chart} />}
      <hr />
      {workflow.steps.map((step, idx) => (
        <div key={idx}>
          <div className="margin-bottom--sm">{step.description}</div>
          <div className="margin-bottom--lg">
            <CodeBlock className="graphql">{step.mutation}</CodeBlock>
            <CodeBlock className="json">{step.variables}</CodeBlock>
          </div>
        </div>
      ))}
    </div>
  );
}
