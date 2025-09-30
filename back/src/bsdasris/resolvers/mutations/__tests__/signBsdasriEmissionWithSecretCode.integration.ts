import { resetDatabase } from "../../../../../integration-tests/helper";
import { ErrorCode } from "../../../../common/errors";
import {
  companyFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { BsdasriStatus } from "@td/prisma";
import {
  bsdasriFactory,
  initialData,
  readyToPublishData
} from "../../../__tests__/factories";
import { prisma } from "@td/prisma";
import type { Mutation } from "@td/codegen-back";
import { SIGN_DASRI_WITH_CODE } from "./signUtils";
import { ZodBsdasriPackagingEnum } from "../../../validation/schema";

describe("Mutation.signBsdasri emission with secret code", () => {
  afterEach(resetDatabase);

  it("should deny emission signature if secret code is incorrect", async () => {
    const { company } = await userWithCompanyFactory("MEMBER");
    const { user: transporter, company: transporterCompany } =
      await userWithCompanyFactory("MEMBER");

    let dasri = await bsdasriFactory({
      opt: {
        ...initialData(company),
        status: BsdasriStatus.INITIAL,
        transporterCompanySiret: transporterCompany.siret
      }
    });
    const { mutate } = makeClient(transporter); // transporter

    const { errors } = await mutate<
      Pick<Mutation, "signBsdasriEmissionWithSecretCode">
    >(SIGN_DASRI_WITH_CODE, {
      variables: {
        id: dasri.id,
        input: {
          author: "Joe",
          securityCode: 9876 // should be 1234, factory default value
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
    dasri = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: dasri.id }
    });
    expect(dasri.status).toEqual("INITIAL");
  });

  it("should put emission signature on a dasri when correct code is provided", async () => {
    const { company } = await userWithCompanyFactory("MEMBER");
    const { user: transporter, company: transporterCompany } =
      await userWithCompanyFactory("MEMBER");
    const destination = await companyFactory();

    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(company),
        ...readyToPublishData(destination),
        status: BsdasriStatus.INITIAL,
        transporterCompanySiret: transporterCompany.siret
      }
    });
    const { mutate } = makeClient(transporter); // emitter

    await mutate<Pick<Mutation, "signBsdasriEmissionWithSecretCode">>(
      SIGN_DASRI_WITH_CODE,
      {
        variables: {
          id: dasri.id,
          input: {
            author: "Marcel",
            securityCode: 1234
          }
        }
      }
    );

    const readyTotakeOverDasri = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: dasri.id }
    });
    expect(readyTotakeOverDasri.status).toEqual("SIGNED_BY_PRODUCER");
    expect(readyTotakeOverDasri.emitterEmissionSignatureAuthor).toEqual(
      "Marcel"
    );
    expect(readyTotakeOverDasri.emitterEmissionSignatureDate).toBeTruthy();
    expect(readyTotakeOverDasri.emissionSignatoryId).toEqual(transporter.id);
    expect(readyTotakeOverDasri.isEmissionTakenOverWithSecretCode).toEqual(
      true
    );
    expect(readyTotakeOverDasri.emittedByEcoOrganisme).toEqual(false);
  });

  it.each([undefined, []])(
    "should fail if emitterWastePackagings is not defined",
    async emitterWastePackagings => {
      // Given
      const { company } = await userWithCompanyFactory("MEMBER");
      const destination = await companyFactory();
      const { user: transporter, company: transporterCompany } =
        await userWithCompanyFactory("MEMBER");
      const dasri = await bsdasriFactory({
        opt: {
          ...initialData(company),
          ...readyToPublishData(destination),
          status: BsdasriStatus.INITIAL,
          transporterCompanySiret: transporterCompany.siret,
          emitterWastePackagings
        }
      });

      // When
      const { mutate } = makeClient(transporter);
      const { errors } = await mutate<Pick<Mutation, "signBsdasri">>(
        SIGN_DASRI_WITH_CODE,
        {
          variables: {
            id: dasri.id,
            input: {
              author: "Marcel",
              securityCode: 1234
            }
          }
        }
      );

      // Then
      expect(errors).not.toBeUndefined();
      expect(errors[0].message).toBe(
        "Le conditionnement de l'émetteur est un champ requis."
      );
    }
  );

  it("should succeed if emitterWastePackagings is defined", async () => {
    // Given
    const { company } = await userWithCompanyFactory("MEMBER");
    const destination = await companyFactory();
    const { user: transporter, company: transporterCompany } =
      await userWithCompanyFactory("MEMBER");
    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(company),
        ...readyToPublishData(destination),
        status: BsdasriStatus.INITIAL,
        transporterCompanySiret: transporterCompany.siret,
        emitterWastePackagings: [
          {
            type: "BOITE_CARTON" as ZodBsdasriPackagingEnum,
            volume: 22,
            quantity: 3
          }
        ]
      }
    });

    // When
    const { mutate } = makeClient(transporter);
    const { errors } = await mutate<Pick<Mutation, "signBsdasri">>(
      SIGN_DASRI_WITH_CODE,
      {
        variables: {
          id: dasri.id,
          input: {
            author: "Marcel",
            securityCode: 1234
          }
        }
      }
    );

    // Then
    expect(errors).toBeUndefined();
  });
});
