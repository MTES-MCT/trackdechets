import { resetDatabase } from "../../../../integration-tests/helper";
import testWorkflow from "../../../__tests__/testWorkflow";
import acheminementDirectWorkflow from "../workflows/acheminementDirect";
import acheminementDirectTransporterEtrangerWorkflow from "../workflows/acheminementDirectTransporteurEtranger";
import multiModalWorkflow from "../workflows/multiModal";
import entreposageProvisoireWorkflow from "../workflows/entreposageProvisoire";
import entreposageProvisoireTransporterEtrangerWorkflow from "../workflows/entreposageProvisoireTransporteurEtranger";
import importBsdPapier from "../workflows/importBsdPapier";
import regroupement from "../workflows/regroupement";
import regroupementTransporterEtranger from "../workflows/regroupementTransporteurEtranger";

describe("Exemples de circuit du bordereau de suivi des déchets dangereux", () => {
  afterEach(resetDatabase);

  it(
    acheminementDirectWorkflow.title,
    async () => {
      await testWorkflow(acheminementDirectWorkflow);
    },
    60000
  );

  it(
    entreposageProvisoireWorkflow.title,
    async () => {
      await testWorkflow(entreposageProvisoireWorkflow);
    },
    60000
  );

  it(
    regroupement.title,
    async () => {
      await testWorkflow(regroupement);
    },
    60000
  );

  it(
    acheminementDirectTransporterEtrangerWorkflow.title,
    async () => {
      await testWorkflow(acheminementDirectTransporterEtrangerWorkflow);
    },
    60000
  );

  it(
    entreposageProvisoireTransporterEtrangerWorkflow.title,
    async () => {
      await testWorkflow(entreposageProvisoireTransporterEtrangerWorkflow);
    },
    60000
  );

  it(
    regroupementTransporterEtranger.title,
    async () => {
      await testWorkflow(regroupementTransporterEtranger);
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

  it(
    importBsdPapier.title,
    async () => {
      await testWorkflow(importBsdPapier);
    },
    60000
  );
});
