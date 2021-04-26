import { resetDatabase } from "../../../../../integration-tests/helper";
import { ErrorCode } from "../../../../common/errors";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { BsdasriStatus } from "@prisma/client";
import { SIGN_DASRI } from "./signUtils";
import { bsdasriFactory, initialData } from "../../../__tests__/factories";
import prisma from "../../../../prisma";

describe("Mutation.signBsdasri emission", () => {
  afterEach(resetDatabase);

  it("should disallow unauthenticated user", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const dasri = await bsdasriFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: company.siret
      }
    });
    const { mutate } = makeClient(); // unauthenticated user
    const { errors } = await mutate(SIGN_DASRI, {
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
    const dasri = await bsdasriFactory({
      ownerId: user.id,
      opt: {
        ...initialData(company),
        status: BsdasriStatus.INITIAL,
        isDraft: true
      }
    });
    const { mutate } = makeClient(user); // emitter

    const { errors } = await mutate(SIGN_DASRI, {
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
    const dasri = await bsdasriFactory({
      ownerId: user.id,
      opt: { ...initialData(company), status: BsdasriStatus.INITIAL }
    });
    const { mutate } = makeClient(user); // emitter

    await mutate(SIGN_DASRI, {
      variables: {
        id: dasri.id,
        input: { type: "EMISSION", author: "Marcel" }
      }
    });

    const signedByTransporterDasri = await prisma.bsdasri.findUnique({
      where: { id: dasri.id }
    });
    expect(signedByTransporterDasri.status).toEqual("SIGNED_BY_PRODUCER");
    expect(signedByTransporterDasri.emissionSignatureAuthor).toEqual("Marcel");
    expect(signedByTransporterDasri.emissionSignatureDate).toBeTruthy();
    expect(signedByTransporterDasri.emissionSignatoryId).toEqual(user.id);
  });
});
