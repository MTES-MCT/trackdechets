import { resetDatabase } from "../../../../../integration-tests/helper";
import type { Query } from "@td/codegen-back";
import { ecoOrganismeFactory, siretify } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";

const ECO_ORGANISMES = `query { ecoOrganismes { siret } }`;

describe("query ecoOrgansime", () => {
  afterEach(resetDatabase);

  it("should return list of registered ecoOrganismes", async () => {
    const { query } = makeClient();
    const siret = siretify(1);
    await ecoOrganismeFactory({
      siret
    });
    const { data } = await query<Pick<Query, "ecoOrganismes">>(ECO_ORGANISMES);
    expect(data.ecoOrganismes.map(c => c.siret)).toEqual([siret]);
  });
});
