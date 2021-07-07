import { Plugin } from "@docusaurus/types";
import bsdWorkflows from "../../back/src/forms/examples/workflows";

// parse workflow definition files
function parseWorkflow(workflow) {
  return {
    title: workflow.title,
    description: workflow.description,
    chart: workflow.chart,
    steps: workflow.steps.map((step) => ({
      description: step.description,
      mutation: step.mutation,
      variables: JSON.stringify(step.variables(workflow.docContext), null, 2),
    })),
  };
}

export default function plugin(): Plugin<any> {
  const backSrc = "../../../back/src";
  return {
    name: "workflow-doc-plugin",
    async loadContent() {
      return {
        bsdd: {
          acheminementDirect: parseWorkflow(bsdWorkflows.acheminementDirect),
          multiModal: parseWorkflow(bsdWorkflows.multiModal),
          entreposageProvisoire: parseWorkflow(
            bsdWorkflows.entreposageProvisoire
          ),
          importBsdPapier: parseWorkflow(bsdWorkflows.importBsdPapier),
        },
        // bsdasri: {
        //   acheminementDirect: loadWorkflow(
        //     path.join(
        //       backSrc,
        //       "dasris/examples/workflows/acheminementDirect.js"
        //     )
        //   ),
        // },
        // bsvhu: {
        //   vhuVersBroyeur: loadWorkflow(
        //     path.join(backSrc, "vhu/examples/workflows/vhuVersBroyeur.js")
        //   ),
        // },
      };
    },
    // make workflows data available to components through the `useGlobalData` hook
    async contentLoaded({ content, actions }) {
      const { setGlobalData } = actions;
      setGlobalData({ workflows: content });
    },
  };
}
