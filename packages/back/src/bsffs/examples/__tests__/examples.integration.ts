import { resetDatabase } from "../../../../integration-tests/helper";
import testWorkflow from "../../../__tests__/testWorkflow";
import collectePetitesQuantitesWorkflow from "../workflows/collectePetitesQuantites";

describe("Exemples de circuit du bordereau de suivi BSFF", () => {
  afterEach(resetDatabase);

  test(
    collectePetitesQuantitesWorkflow.title,
    async () => {
      await testWorkflow(collectePetitesQuantitesWorkflow);
    },
    10000
  );
});
