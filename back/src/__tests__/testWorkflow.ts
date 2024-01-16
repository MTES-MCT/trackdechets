import { isForeignVat } from "@td/constants";
import { Workflow } from "../common/workflow";
import {
  userWithCompanyFactory,
  ecoOrganismeFactory,
  transporterReceiptFactory
} from "./factories";
import makeClient from "./testClient";

async function testWorkflow(workflow: Workflow) {
  // init a context that can be passed from one step to the other
  let context = {};

  // create the different companies used in this workflow
  for (const workflowCompany of workflow.companies) {
    const { user, company } = await userWithCompanyFactory("MEMBER", {
      companyTypes: workflowCompany.companyTypes,
      ...(workflowCompany?.opt || {})
    });
    if (workflowCompany.companyTypes.includes("ECO_ORGANISME")) {
      // create ecoOrganisme to allow its user to perform api calls
      await ecoOrganismeFactory({ siret: company.siret!, handleBsdasri: true });
    }
    if (
      workflowCompany.companyTypes.includes("TRANSPORTER") &&
      !isForeignVat(company.vatNumber)
    ) {
      // create transporter receipt
      await transporterReceiptFactory({ company });
    }
    context = { ...context, [workflowCompany.name]: { ...company, user } };
  }

  // run the steps one by one
  for (const step of workflow.steps) {
    const client = makeClient(context[step.company].user);

    const { errors, data: response } = await (() => {
      if (step.mutation) {
        return client.mutate(step.mutation, {
          variables: step.variables(context)
        });
      } else if (step.query) {
        return client.query(step.query, {
          variables: step.variables(context)
        });
      }
      throw new Error();
    })();

    expect(errors).toBeUndefined();
    const data = step.data(response);
    if (step.expected) {
      expect(data).toEqual(expect.objectContaining(step.expected));
    }
    if (step.setContext) {
      context = step.setContext(context, data);
    }
  }
}

export default testWorkflow;
