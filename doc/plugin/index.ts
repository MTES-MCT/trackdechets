import { Plugin } from "@docusaurus/types";
import bsdWorkflows from "../../back/src/forms/examples/workflows";
import bsdasriWorkflows from "../../back/src/bsdasris/examples/workflows";
import bsvhuWorkflows from "../../back/src/bsvhu/examples/workflows";
import bsffWorkflows from "../../back/src/bsffs/examples/workflows";
import bsdaWorkflows from "../../back/src/bsda/examples/workflows";
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
          regroupement: parseWorkflow(bsdWorkflows.regroupement),
          importBsdPapier: parseWorkflow(bsdWorkflows.importBsdPapier),
        },
        bsdasri: {
          acheminementDirect: parseWorkflow(
            bsdasriWorkflows.acheminementDirect
          ),
          emportDirect: parseWorkflow(bsdasriWorkflows.emportDirect),
          dasriDeSynthese: parseWorkflow(bsdasriWorkflows.dasriDeSynthese),
          ecoOrganisme: parseWorkflow(bsdasriWorkflows.ecoOrganisme),
          signatureCodeSecret: parseWorkflow(bsdasriWorkflows.signatureCodeSecret),
          signatureCodeSecretEcoOrganisme: parseWorkflow(bsdasriWorkflows.signatureCodeSecretEcoOrganisme),
          dasriDeGroupement: parseWorkflow(bsdasriWorkflows.dasriDeGroupement),
        },
        bsvhu: {
          vhuVersBroyeur: parseWorkflow(bsvhuWorkflows.vhuVersBroyeur),
        },
        bsff: {
          collectePetitesQuantites: parseWorkflow(
            bsffWorkflows.collectePetitesQuantites
          ),
        },
        bsda: {
          collecteChantier: parseWorkflow(bsdaWorkflows.collecteChantier),
          collecteChantierParticulier: parseWorkflow(
            bsdaWorkflows.collecteChantierParticulier
          ),
          groupement: parseWorkflow(bsdaWorkflows.groupement),
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
