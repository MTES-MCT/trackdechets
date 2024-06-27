import { resetDatabase } from "../../../../integration-tests/helper";
import testWorkflow from "../../../__tests__/testWorkflow";
import collectePetitesQuantitesWorkflow from "../workflows/collecteFluidesParOperateur";
import collectePetitesQuantitesTransporteurEtrangerWorkflow from "../workflows/collecteFluidesParOperateurTransporteurEtranger";
import groupementWorkflow from "../workflows/groupement";
import multiModalWorkflow from "../workflows/multiModal";

describe("Exemples de circuit du bordereau de suivi BSFF", () => {
  afterEach(resetDatabase);

  it(
    collectePetitesQuantitesWorkflow.title,
    async () => {
      await testWorkflow(collectePetitesQuantitesWorkflow);
    },
    60000
  );

  it(
    collectePetitesQuantitesTransporteurEtrangerWorkflow.title,
    async () => {
      await testWorkflow(collectePetitesQuantitesTransporteurEtrangerWorkflow);
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
