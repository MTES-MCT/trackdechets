export type WorkflowStep = {
  description: string;
  mutation: string;
  variables: (ctx: any) => any;
  expected: any;
  company: string;
  data: (response: any) => any;
  setContext?: (ctx: Context, data: any) => Context;
};

export type Workflow = {
  title: string;
  description?: string;
  companies: { name: string; companyTypes: string[] }[];
  steps: WorkflowStep[];
  docContext: any;
  chart?: string;
};
