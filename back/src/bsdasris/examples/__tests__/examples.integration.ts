import { resetDatabase } from "../../../../integration-tests/helper";
import testWorkflow from "../../../__tests__/testWorkflow";
import acheminementDirectWorkflow from "../workflows/acheminementDirect";
import emportDirect from "../workflows/emportDirect";
import dasriDeSynthese from "../workflows/dasriDeSynthese";

describe("Exemples de circuit du bordereau de suivi DASRI", () => {
  afterEach(resetDatabase);

  test(
    acheminementDirectWorkflow.title,
    async () => {
      await testWorkflow(acheminementDirectWorkflow);
    },
    10000
  );

  test(
    emportDirect.title,
    async () => {
      await testWorkflow(emportDirect);
    },
    10000
  );

  test(
    dasriDeSynthese.title,
    async () => {
      await testWorkflow(dasriDeSynthese);
    },
    10000
  );
});
