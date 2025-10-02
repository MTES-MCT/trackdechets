import { Plugin } from "@docusaurus/types";
import bsdWorkflows from "../../../back/src/forms/examples/workflows";
import bsdasriWorkflows from "../../../back/src/bsdasris/examples/workflows";
import bsvhuWorkflows from "../../../back/src/bsvhu/examples/workflows";
import bsffWorkflows from "../../../back/src/bsffs/examples/workflows";
import bsdaWorkflows from "../../../back/src/bsda/examples/workflows";
import bspaohWorkflows from "../../../back/src/bspaoh/examples/workflows";
import { Workflow } from "../../../back/src/common/workflow";


// parse workflow definition files
function parseWorkflow(workflow: Workflow) {
  return {
    title: workflow.title,
    description: workflow.description,
    chart: workflow.chart,
    steps: workflow.steps
      .filter((s) => !s.hideInDoc)
      .map((step) => ({
        description: step.description,
        mutation: step.mutation,
        query: step.query,
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
          multiModalv2: parseWorkflow(bsdWorkflows.multiModalv2),
          entreposageProvisoire: parseWorkflow(
            bsdWorkflows.entreposageProvisoire
          ),
          regroupement: parseWorkflow(bsdWorkflows.regroupement),
          importBsdPapier: parseWorkflow(bsdWorkflows.importBsdPapier),
          annexe1: parseWorkflow(bsdWorkflows.annexe1),
        },
        bsdasri: {
          acheminementDirect: parseWorkflow(
            bsdasriWorkflows.acheminementDirect
          ),
          emportDirect: parseWorkflow(bsdasriWorkflows.emportDirect),
          dasriDeSynthese: parseWorkflow(bsdasriWorkflows.dasriDeSynthese),
          ecoOrganisme: parseWorkflow(bsdasriWorkflows.ecoOrganisme),
          signatureCodeSecret: parseWorkflow(
            bsdasriWorkflows.signatureCodeSecret
          ),
          signatureCodeSecretEcoOrganisme: parseWorkflow(
            bsdasriWorkflows.signatureCodeSecretEcoOrganisme
          ),
          dasriDeGroupement: parseWorkflow(bsdasriWorkflows.dasriDeGroupement),
        },
        bsvhu: {
          vhuVersBroyeur: parseWorkflow(bsvhuWorkflows.vhuVersBroyeur),
          multiModal: parseWorkflow(bsvhuWorkflows.multiModal),
        },
        bsff: {
          collecteFluidesParOperateur: parseWorkflow(
            bsffWorkflows.collecteFluidesParOperateur
          ),
          groupement: parseWorkflow(bsffWorkflows.groupement),
          multiModal: parseWorkflow(bsffWorkflows.multiModal)
        },
        bsda: {
          collecteChantier: parseWorkflow(bsdaWorkflows.collecteChantier),
          collecteChantierParticulier: parseWorkflow(
            bsdaWorkflows.collecteChantierParticulier
          ),
          groupement: parseWorkflow(bsdaWorkflows.groupement),
          multiModal: parseWorkflow(bsdaWorkflows.multiModal)
        },
        bspaoh: {
          acheminementDirect: parseWorkflow(
            bspaohWorkflows.acheminementDirect),
          acheminementDirectAvecDepot: parseWorkflow(bspaohWorkflows.acheminementDirectAvecDepot),
          acheminementDirectDepuisBrouillon: parseWorkflow(bspaohWorkflows.acheminementDirectDepuisBrouillon),
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
