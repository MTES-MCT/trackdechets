import { resetDatabase } from "../../../../integration-tests/helper";
import testWorkflow from "../../../__tests__/testWorkflow";
import acheminementDirect from "../workflows/acheminementDirect";
import acheminementDirectAvecDepot from "../workflows/acheminementDirectAvecDepot";
import acheminementDirectDepuisBrouillon from "../workflows/acheminementDirectDepuisBrouillon";

describe("Exemples de circuit du bordereau PAOH", () => {
  afterEach(resetDatabase);

  it(
    acheminementDirect.title,
    async () => {
      await testWorkflow(acheminementDirect);
    },
    60000
  );

  it(
    acheminementDirectDepuisBrouillon.title,
    async () => {
      await testWorkflow(acheminementDirectDepuisBrouillon);
    },
    60000
  );

  it(
    acheminementDirectAvecDepot.title,
    async () => {
      await testWorkflow(acheminementDirectAvecDepot);
    },
    60000
  );
});
