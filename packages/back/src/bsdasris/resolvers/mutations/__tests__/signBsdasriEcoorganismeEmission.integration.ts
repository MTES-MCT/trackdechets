import { resetDatabase } from "../../../../../integration-tests/helper";

import {
  userWithCompanyFactory,
  companyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { BsdasriStatus } from "@prisma/client";
import { SIGN_DASRI } from "./signUtils";
import { bsdasriFactory, initialData } from "../../../__tests__/factories";
import prisma from "../../../../prisma";
import { Mutation } from "@trackdechets/codegen/src/back.gen";

describe("Mutation.signBsdasri emission", () => {
  afterEach(resetDatabase);

  it("should put emission signature on a dasri signed by eco-organisme", async () => {
    const { company: ecoOrganismeCompany, user: ecoOrganismeUser } =
      await userWithCompanyFactory("MEMBER");
    await prisma.ecoOrganisme.create({
      data: {
        address: "",
        name: "Eco-Organisme",
        siret: ecoOrganismeCompany.siret,
        handleBsdasri: true
      }
    });
    const emitterCompany = await companyFactory();
    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(emitterCompany),
        status: BsdasriStatus.INITIAL,
        ecoOrganismeSiret: ecoOrganismeCompany.siret,
        ecoOrganismeName: ecoOrganismeCompany.name
      }
    });
    const { mutate } = makeClient(ecoOrganismeUser); // emitter

    await mutate<Pick<Mutation, "signBsdasri">>(SIGN_DASRI, {
      variables: {
        id: dasri.id,
        input: { type: "EMISSION", author: "Eco-org" }
      }
    });

    const signedByEcoOrgDasri = await prisma.bsdasri.findUnique({
      where: { id: dasri.id }
    });
    expect(signedByEcoOrgDasri.status).toEqual("SIGNED_BY_PRODUCER");
    expect(signedByEcoOrgDasri.emitterEmissionSignatureAuthor).toEqual(
      "Eco-org"
    );
    expect(signedByEcoOrgDasri.emitterEmissionSignatureDate).toBeTruthy();
    expect(signedByEcoOrgDasri.emissionSignatoryId).toEqual(
      ecoOrganismeUser.id
    );
    expect(signedByEcoOrgDasri.emittedByEcoOrganisme).toBe(true);
  });
});
