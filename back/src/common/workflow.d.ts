/**
 * A workflow defines a series of steps applied to a BSD in a particular
 * traceability use case (acheminement direct, regroupement, reconditionnement, multi-modal, etc)
 * The different steps should be composables and testables.
 * A context containing runtime variables is passed from one step to the other.
 * Worflows definition is parsed by the doc project to create code examples in the documentation
 */
export type Workflow = {
  // Title of the workflow
  title: string;
  // Longer description of the workflow explaining the traceability use case;
  description?: string;
  // Name and profile of the companies involved in the workflow
  companies: {
    name: string;
    companyTypes: string[];
    wasteProcessorTypes?: string[];
    collectorTypes?: string[];
    opt?: any;
  }[];
  // List of steps to be applied to the BSD
  steps: WorkflowStep[];
  // Mocked context used in the documentation code examples
  docContext: any;
  // Optional Mermaid chart definition representing the workflow
  chart?: string;
};

/**
 * A composable and testable step used in a workflow
 */
export type WorkflowStep = {
  // Description of the step
  description: string;
  // GraphQL mutation to apply
  mutation?: string;
  // GraphQL query to run
  query?: string;
  // GraphQL variables";
  variables: (ctx: any) => any;
  // Expected result of the mutation
  expected?: any;
  // Name of the company performing the mutation as defined in the parent workflow companies field
  company: string;
  // How to parse GraphQL response to get data
  data: (response: any) => any;
  // Optional callback to update the runtime context that is passed from one step to the other
  setContext?: (ctx: Context, data: any) => Context;
  // Optional parameter to hide this step in the documentation
  hideInDoc?: boolean;
};
