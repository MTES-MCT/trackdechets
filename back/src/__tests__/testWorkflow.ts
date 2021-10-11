import { userWithCompanyFactory } from "./factories";
import makeClient from "./testClient";

async function testWorkflow(workflow) {
  // init a context that can be passed from one step to the other
  let context = {};

  // create the different companies used in this workflow
  for (const workflowCompany of workflow.companies) {
    const { user, company } = await userWithCompanyFactory("MEMBER", {
      companyTypes: workflowCompany.companyTypes,
      ...(workflowCompany?.opt || {})
    });
    context = { ...context, [workflowCompany.name]: { ...company, user } };
  }

  // run the steps one by one
  for (const step of workflow.steps) {
    const { mutate } = makeClient(context[step.company].user);
    const { data: response } = await mutate(step.mutation, {
      variables: step.variables(context)
    });

    const data = step.data(response);
    expect(data).toEqual(expect.objectContaining(step.expected));
    if (step.setContext) {
      context = step.setContext(context, data);
    }
  }
}

export default testWorkflow;
