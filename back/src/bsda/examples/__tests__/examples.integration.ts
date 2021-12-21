import { resetDatabase } from "../../../../integration-tests/helper";
import testWorkflow from "../../../__tests__/testWorkflow";
import collecteChantierWorkflow from "../workflows/collecteChantier";
import collecteChantierParticulierWorkflow from "../workflows/collecteChantierParticulier";
import groupementWorkflow from "../workflows/groupement";

describe("Exemples de circuit du bordereau de suivi amiante", () => {
  afterEach(resetDatabase);

  test(
    collecteChantierWorkflow.title,
    async () => {
      await testWorkflow(collecteChantierWorkflow);
    },
    10000
  );

  test(
    collecteChantierParticulierWorkflow.title,
    async () => {
      await testWorkflow(collecteChantierParticulierWorkflow);
    },
    10000
  );

  test(
    groupementWorkflow.title,
    async () => {
      await testWorkflow(groupementWorkflow);
    },
    20000
  );
});
