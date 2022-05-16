import { resetDatabase } from "../../../../integration-tests/helper";
import testWorkflow from "../../../__tests__/testWorkflow";
import acheminementDirect from "../workflows/acheminementDirect";
import emportDirect from "../workflows/emportDirect";
import dasriDeSynthese from "../workflows/dasriDeSynthese";
import acheminementDirectEcoOrganisme from "../workflows/ecoOrganisme";
import signatureCodeSecret from "../workflows/signatureCodeSecret";
import signatureCodeSecretEcoOrganisme from "../workflows/signatureCodeSecretEcoOrganisme";

describe("Exemples de circuit du bordereau de suivi DASRI", () => {
  afterEach(resetDatabase);

  test(
    signatureCodeSecretEcoOrganisme.title,
    async () => {
      await testWorkflow(signatureCodeSecretEcoOrganisme);
    },
    10000
  );

  test(
    signatureCodeSecret.title,
    async () => {
      await testWorkflow(signatureCodeSecret);
    },
    10000
  );

  test(
    acheminementDirectEcoOrganisme.title,
    async () => {
      await testWorkflow(acheminementDirectEcoOrganisme);
    },
    10000
  );

  test(
    acheminementDirect.title,
    async () => {
      await testWorkflow(acheminementDirect);
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
