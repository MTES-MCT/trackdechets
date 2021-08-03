import { resetDatabase } from "../../../../integration-tests/helper";
import testWorkflow from "../../../__tests__/testWorkflow";
import acheminementDirectWorkflow from "../workflows/acheminementDirect";

describe("Exemples de circuit du bordereau de suivi DASRI", () => {
  afterEach(resetDatabase);

  test(
    acheminementDirectWorkflow.title,
    async () => {
      await testWorkflow(acheminementDirectWorkflow);
    },
    10000
  );
});
