import { resetDatabase } from "../../../../integration-tests/helper";
import testWorkflow from "../../../__tests__/testWorkflow";
import acheminementDirectWorkflow from "../workflows/acheminementDirect";
import multiModalWorkflow from "../workflows/multiModal";
import entreposageProvisoireWorkflow from "../workflows/entreposageProvisoire";
import importBsdPapier from "../workflows/importBsdPapier";

describe("Exemples de circuit du bordereau de suivi des déchets dangereux", () => {
  afterEach(resetDatabase);

  test(
    acheminementDirectWorkflow.title,
    async () => {
      await testWorkflow(acheminementDirectWorkflow);
    },
    10000
  );

  test(
    entreposageProvisoireWorkflow.title,
    async () => {
      await testWorkflow(entreposageProvisoireWorkflow);
    },
    10000
  );

  test(
    multiModalWorkflow.title,
    async () => {
      await testWorkflow(multiModalWorkflow);
    },
    10000
  );

  test(
    importBsdPapier.title,
    async () => {
      await testWorkflow(importBsdPapier);
    },
    10000
  );
});
