const path = require("path");

// parse workflow definition files
function loadWorkflow(path) {
  const workflow = require(path);
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

module.exports = function plugin() {
  const backSrc = "../back/src";
  return {
    name: "workflow-doc-plugin",
    async loadContent() {
      return {
        bsdd: {
          acheminementDirect: loadWorkflow(
            path.join(backSrc, "forms/examples/workflows/acheminementDirect.js")
          ),
          multiModal: loadWorkflow(
            path.join(backSrc, "forms/examples/workflows/multiModal.js")
          ),
          entreposageProvisoire: loadWorkflow(
            path.join(
              backSrc,
              "forms/examples/workflows/entreposageProvisoire.js"
            )
          ),
          importBsdPapier: loadWorkflow(
            path.join(backSrc, "forms/examples/workflows/importBsdPapier.js")
          ),
        },
        bsdasri: {
          acheminementDirect: loadWorkflow(
            path.join(
              backSrc,
              "dasris/examples/workflows/acheminementDirect.js"
            )
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
};
