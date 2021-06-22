import React from "react";
import { usePluginData } from "@docusaurus/useGlobalData";
import CodeBlock from "@theme/CodeBlock";
import { resolve } from "../utils";

export default function Workflow({ path }) {
  const { workflows } = usePluginData("workflow-doc-plugin");
  const workflow = resolve(path, workflows);
  return (
    <div>
      {workflow.description && (
        <>
          <div>{workflow.description}</div>
          <hr />
        </>
      )}
      {workflow.steps.map((step) => (
        <div>
          <div class="margin-bottom--sm">{step.description}</div>
          <div class="margin-bottom--lg">
            <CodeBlock className="graphql">{step.mutation}</CodeBlock>
            <CodeBlock className="json">{step.variables}</CodeBlock>
          </div>
        </div>
      ))}
    </div>
  );
}
