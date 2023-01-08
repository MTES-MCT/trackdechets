import { resetDatabase } from "../../../../integration-tests/helper";
import testWorkflow from "../../../__tests__/testWorkflow";
import vhuVersBroyeurWorkflow from "../workflows/vhuVersBroyeur";
import vhuVersBroyeurTransporteurEtrangerWorkflow from "../workflows/vhuVersBroyeurTransporteurEtranger";

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
});
