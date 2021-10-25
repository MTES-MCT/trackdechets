import { resetDatabase } from "../../../../integration-tests/helper";
import testWorkflow from "../../../__tests__/testWorkflow";
import vhuVersBroyeurWorkflow from "../workflows/vhuVersBroyeur";

describe("Exemples de circuit du bordereau de suivi VHU", () => {
  afterEach(resetDatabase);

  test(
    vhuVersBroyeurWorkflow.title,
    async () => {
      await testWorkflow(vhuVersBroyeurWorkflow);
    },
    10000
  );
});
