import { resetDatabase } from "../../../../../integration-tests/helper";
import { ErrorCode } from "../../../../common/errors";
import {
  companyFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { BsdasriStatus } from "@prisma/client";
import { SIGN_DASRI } from "./signUtils";
import {
  bsdasriFactory,
  initialData,
  readyToPublishData
} from "../../../__tests__/factories";
import { prisma } from "@td/prisma";
import type { Mutation } from "@td/codegen-back";

describe("Mutation.signBsdasri emission", () => {
  afterEach(resetDatabase);

  it("should disallow unauthenticated user", async () => {
    const { company } = await userWithCompanyFactory("MEMBER");
    const dasri = await bsdasriFactory({
      opt: {
        emitterCompanySiret: company.siret
      }
    });
    const { mutate } = makeClient(); // unauthenticated user
    const { errors } = await mutate<Pick<Mutation, "signBsdasri">>(SIGN_DASRI, {
      variables: {
        id: dasri.id,
        input: { type: "EMISSION", author: "Marcel" }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: "Vous n'êtes pas connecté.",
        extensions: expect.objectContaining({
          code: ErrorCode.UNAUTHENTICATED
        })
      })
    ]);
  });

  it("a draft dasri should not be signed", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const destination = await companyFactory();
    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(company),
        ...readyToPublishData(destination),
        status: BsdasriStatus.INITIAL,
        isDraft: true
      }
    });
    const { mutate } = makeClient(user); // emitter

    const { errors } = await mutate<Pick<Mutation, "signBsdasri">>(SIGN_DASRI, {
      variables: {
        id: dasri.id,
        input: { type: "EMISSION", author: "Marcel" }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: "Vous ne pouvez pas passer ce bordereau à l'état souhaité.",
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });

  it("should put emission signature on a dasri", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const destination = await companyFactory();
    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(company),
        ...readyToPublishData(destination),
        status: BsdasriStatus.INITIAL
      }
    });
    const { mutate } = makeClient(user); // emitter

    await mutate<Pick<Mutation, "signBsdasri">>(SIGN_DASRI, {
      variables: {
        id: dasri.id,
        input: { type: "EMISSION", author: "Marcel" }
      }
    });

    const signedByEmitterDasri = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: dasri.id }
    });
    expect(signedByEmitterDasri.status).toEqual("SIGNED_BY_PRODUCER");
    expect(signedByEmitterDasri.emitterEmissionSignatureAuthor).toEqual(
      "Marcel"
    );
    expect(signedByEmitterDasri.emitterEmissionSignatureDate).toBeTruthy();
    expect(signedByEmitterDasri.emissionSignatoryId).toEqual(user.id);
    expect(signedByEmitterDasri.emittedByEcoOrganisme).toBe(false);
  });

  it("should reject emission signature on dasri when emitterWastePackagings field is empty", async () => {
    // Test new rule: `emitterWastePackagings` is not required for publication anymore, but for emission signature

    const { user, company } = await userWithCompanyFactory("MEMBER");
    const destination = await companyFactory();
    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(company),
        ...readyToPublishData(destination),
        emitterWastePackagings: [],
        status: BsdasriStatus.INITIAL
      }
    });

    const { mutate } = makeClient(user); // emitter

    const { errors } = await mutate<Pick<Mutation, "signBsdasri">>(SIGN_DASRI, {
      variables: {
        id: dasri.id,
        input: { type: "EMISSION", author: "Marcel" }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: "Le conditionnement de l'émetteur est un champ requis."
      })
    ]);
  });

  it("should fail if data does not validate", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const destination = await companyFactory();
    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(company),
        ...readyToPublishData(destination),
        emitterWasteWeightIsEstimate: true,
        emitterWasteWeightValue: null, // required because of emitterWasteWeightIsEstimate
        status: BsdasriStatus.INITIAL
      }
    });
    const { mutate } = makeClient(user); // emitter

    const { errors } = await mutate<Pick<Mutation, "signBsdasri">>(SIGN_DASRI, {
      variables: {
        id: dasri.id,
        input: { type: "EMISSION", author: "Marcel" }
      }
    });

    const signedByEmitterDasri = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: dasri.id }
    });
    expect(signedByEmitterDasri.status).toEqual("INITIAL");

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Le poids de déchets émis en kg est obligatoire si vous renseignez le type de pesée.",

        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });
});
