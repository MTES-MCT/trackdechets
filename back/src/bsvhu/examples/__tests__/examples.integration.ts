import { resetDatabase } from "../../../../integration-tests/helper";
import testWorkflow from "../../../__tests__/testWorkflow";
import vhuVersBroyeurWorkflow from "../workflows/vhuVersBroyeur";
import vhuVersBroyeurTransporteurEtrangerWorkflow from "../workflows/vhuVersBroyeurTransporteurEtranger";
import multiModalWorkflow from "../workflows/multiModal";

describe("Exemples de circuit du bordereau de suivi VHU", () => {
  afterEach(resetDatabase);

  it(
    vhuVersBroyeurWorkflow.title,
    async () => {
      await testWorkflow(vhuVersBroyeurWorkflow);
    },
    60000
  );

  it(
    vhuVersBroyeurTransporteurEtrangerWorkflow.title,
    async () => {
      await testWorkflow(vhuVersBroyeurTransporteurEtrangerWorkflow);
    },
    60000
  );

  it(
    multiModalWorkflow.title,
    async () => {
      await testWorkflow(multiModalWorkflow);
    },
    60000
  );
});
