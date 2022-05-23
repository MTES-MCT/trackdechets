import { resetDatabase } from "../../../../../integration-tests/helper";
import { Query } from "@trackdechets/codegen/src/back.gen";
import prisma from "../../../../prisma";
import makeClient from "../../../../__tests__/testClient";

const ECO_ORGANISMES = `query { ecoOrganismes { siret } }`;

describe("query ecoOrgansime", () => {
  afterEach(resetDatabase);

  it("should return list of registered ecoOrganismes", async () => {
    const { query } = makeClient();
    const siret = "11111111111111";
    await prisma.ecoOrganisme.create({
      data: { siret, name: "", address: "" }
    });
    const { data } = await query<Pick<Query, "ecoOrganismes">>(ECO_ORGANISMES);
    expect(data.ecoOrganismes.map(c => c.siret)).toEqual([siret]);
  });
});
