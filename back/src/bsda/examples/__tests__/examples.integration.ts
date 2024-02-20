import { resetDatabase } from "../../../../integration-tests/helper";
import testWorkflow from "../../../__tests__/testWorkflow";
import collecteChantierWorkflow from "../workflows/collecteChantier";
import collecteChantierTransporteurEtranger from "../workflows/collecteChantierTransporteurEtranger";
import collecteChantierParticulierWorkflow from "../workflows/collecteChantierParticulier";
import groupementWorkflow from "../workflows/groupement";
import multiModalWorkflow from "../workflows/multiModal";

describe("Exemples de circuit du bordereau de suivi amiante", () => {
  afterEach(resetDatabase);

  it(
    collecteChantierWorkflow.title,
    async () => {
      await testWorkflow(collecteChantierWorkflow);
    },
    60000
  );

  it(
    collecteChantierTransporteurEtranger.title,
    async () => {
      await testWorkflow(collecteChantierTransporteurEtranger);
    },
    60000
  );

  it(
    collecteChantierParticulierWorkflow.title,
    async () => {
      await testWorkflow(collecteChantierParticulierWorkflow);
    },
    60000
  );

  it(
    groupementWorkflow.title,
    async () => {
      await testWorkflow(groupementWorkflow);
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
