export type Step<Context, MutationArgs, R> = (
  company: string
) => {
  description: string;
  mutation: string;
  variables: (ctx: Context) => MutationArgs;
  expected: any;
  company: string;
  setContext: (ctx: Context, data: R) => Context;
};

export type Workflow<Context> = {
  title: string;
  description?: string;
  companies: { name: string; companyTypes: string[] }[];
  steps: Step<Context>[];
  docContext: Context;
  chart?: string;
};
