import { prisma } from "../../../../generated/prisma-client";
import { resetDatabase } from "../../../../../integration-tests/helper";
import makeClient from "../../../../__tests__/testClient";
import { ExecutionResult } from "graphql";
import { Query } from "../../../../generated/graphql/types";

const ECO_ORGANISMES = `query { ecoOrganismes { siret } }`;

describe("query ecoOrgansime", () => {
  afterEach(resetDatabase);

  it("should return list of registered ecoOrganismes", async () => {
    const { query } = makeClient();
    const siret = "11111111111111";
    await prisma.createEcoOrganisme({ siret, name: "", address: "" });
    const { data } = await query<ExecutionResult<Pick<Query, "ecoOrganismes">>>(
      ECO_ORGANISMES
    );
    expect(data.ecoOrganismes.map(c => c.siret)).toEqual([siret]);
  });
});
