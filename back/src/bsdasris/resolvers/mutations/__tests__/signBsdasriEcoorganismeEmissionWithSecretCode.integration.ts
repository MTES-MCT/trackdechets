import { resetDatabase } from "../../../../../integration-tests/helper";
import { ErrorCode } from "../../../../common/errors";
import {
  userWithCompanyFactory,
  companyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { BsdasriStatus } from "@prisma/client";
import {
  bsdasriFactory,
  initialData,
  readyToPublishData
} from "../../../__tests__/factories";
import prisma from "../../../../prisma";
import { Mutation } from "../../../../generated/graphql/types";
import { SIGN_DASRI_WITH_CODE } from "./signUtils";

describe("Mutation.signBsdasri emission with secret code", () => {
  afterEach(resetDatabase);

  it("should deny emission signature if secret code is incorrect", async () => {
    const { company: ecoOrganismeCompany } = await userWithCompanyFactory(
      "MEMBER",
      { securityCode: 7777 }
    );

    await prisma.ecoOrganisme.create({
      data: {
        address: "",
        name: "Eco-Organisme",
        siret: ecoOrganismeCompany.siret!,
        handleBsdasri: true
      }
    });
    const emitterCompany = await companyFactory();
    const { user: transporter, company: transporterCompany } =
      await userWithCompanyFactory("MEMBER");

    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(emitterCompany),
        status: BsdasriStatus.INITIAL,
        ecoOrganismeSiret: ecoOrganismeCompany.siret,
        ecoOrganismeName: ecoOrganismeCompany.name,
        transporterCompanySiret: transporterCompany.siret
      }
    });
    const { mutate } = makeClient(transporter); // for ecoOrganisme

    const { errors } = await mutate<
      Pick<Mutation, "signBsdasriEmissionWithSecretCode">
    >(SIGN_DASRI_WITH_CODE, {
      variables: {
        id: dasri.id,
        input: {
          author: "Joe",
          securityCode: 7771, // should be 7777, factory default value
          signatureAuthor: "ECO_ORGANISME"
        }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: "Le code de signature est invalide.",
        extensions: expect.objectContaining({
          code: ErrorCode.FORBIDDEN
        })
      })
    ]);
    const updatedDasri = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: dasri.id }
    });
    expect(updatedDasri.status).toEqual("INITIAL");
  });

  it("should put emission signature on a dasri when correct code is provided", async () => {
    const { company: ecoOrganismeCompany } = await userWithCompanyFactory(
      "MEMBER",
      { securityCode: 7777 }
    );
    const destination = await companyFactory();
    await prisma.ecoOrganisme.create({
      data: {
        address: "",
        name: "Eco-Organisme",
        siret: ecoOrganismeCompany.siret!,
        handleBsdasri: true
      }
    });
    const emitterCompany = await companyFactory();
    const { user: transporter, company: transporterCompany } =
      await userWithCompanyFactory("MEMBER");

    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(emitterCompany),
        ...readyToPublishData(destination),
        status: BsdasriStatus.INITIAL,
        ecoOrganismeSiret: ecoOrganismeCompany.siret,
        ecoOrganismeName: ecoOrganismeCompany.name,
        transporterCompanySiret: transporterCompany.siret
      }
    });
    const { mutate } = makeClient(transporter); // for ecoOrganisme

    await mutate<Pick<Mutation, "signBsdasriEmissionWithSecretCode">>(
      SIGN_DASRI_WITH_CODE,
      {
        variables: {
          id: dasri.id,
          input: {
            author: "Jean-Maxence",
            securityCode: 7777,
            signatureAuthor: "ECO_ORGANISME"
          }
        }
      }
    );

    const readyTotakeOverDasri = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: dasri.id }
    });
    expect(readyTotakeOverDasri.status).toEqual("SIGNED_BY_PRODUCER");
    expect(readyTotakeOverDasri.emitterEmissionSignatureAuthor).toEqual(
      "Jean-Maxence"
    );
    expect(readyTotakeOverDasri.emitterEmissionSignatureDate).toBeTruthy();
    expect(readyTotakeOverDasri.emissionSignatoryId).toEqual(transporter.id);
    expect(readyTotakeOverDasri.isEmissionTakenOverWithSecretCode).toEqual(
      true
    );
    expect(readyTotakeOverDasri.emittedByEcoOrganisme).toEqual(true);
  });
});
