import { resetDatabase } from "../../../../integration-tests/helper";
import testWorkflow from "../../../__tests__/testWorkflow";
import collectePetitesQuantitesWorkflow from "../workflows/collecteFluidesParOperateur";
import groupementWorkflow from "../workflows/groupement";

describe("Exemples de circuit du bordereau de suivi BSFF", () => {
  afterEach(resetDatabase);

  test(
    collectePetitesQuantitesWorkflow.title,
    async () => {
      await testWorkflow(collectePetitesQuantitesWorkflow);
    },
    60000
  );

  test.only(
    groupementWorkflow.title,
    async () => {
      await testWorkflow(groupementWorkflow);
    },
    60000
  );
});
