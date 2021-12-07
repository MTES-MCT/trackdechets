import { resetDatabase } from "../../../../integration-tests/helper";
import testWorkflow from "../../../__tests__/testWorkflow";
import acheminementDirectWorkflow from "../workflows/acheminementDirect";
import acheminementDirectParticulierWorkflow from "../workflows/acheminementDirectParticulier";

describe("Exemples de circuit du bordereau de suivi amiante", () => {
  afterEach(resetDatabase);

  test(
    acheminementDirectWorkflow.title,
    async () => {
      await testWorkflow(acheminementDirectWorkflow);
    },
    10000
  );

  test(
    acheminementDirectParticulierWorkflow.title,
    async () => {
      await testWorkflow(acheminementDirectParticulierWorkflow);
    },
    10000
  );
});
