import { Plugin } from "@docusaurus/types";
import bsdWorkflows from "../../back/src/forms/examples/workflows";
import bsdasriWorkflows from "../../back/src/bsdasris/examples/workflows";
import bsvhuWorkflows from "../../back/src/bsvhu/examples/workflows";
import bsffWorkflows from "../../back/src/bsffs/examples/workflows";
import { Workflow } from "../../back/src/common/workflow";

// parse workflow definition files
function parseWorkflow(workflow: Workflow) {
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
        bsdasri: {
          acheminementDirect: parseWorkflow(
            bsdasriWorkflows.acheminementDirect
          ),
          emportDirect: parseWorkflow(bsdasriWorkflows.emportDirect),
        },
        bsvhu: {
          vhuVersBroyeur: parseWorkflow(bsvhuWorkflows.vhuVersBroyeur),
        },
        bsff: {
          collectePetitesQuantites: parseWorkflow(
            bsffWorkflows.collectePetitesQuantites
          ),
        },
      };
    },
    // make workflows data available to components through the `useGlobalData` hook
    async contentLoaded({ content, actions }) {
      const { setGlobalData } = actions;
      setGlobalData({ workflows: content });
    },
  };
}
