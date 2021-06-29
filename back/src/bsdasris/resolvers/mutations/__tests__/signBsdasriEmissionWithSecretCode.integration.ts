import { resetDatabase } from "../../../../../integration-tests/helper";
import { ErrorCode } from "../../../../common/errors";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { BsdasriStatus } from "@prisma/client";
import { bsdasriFactory, initialData } from "../../../__tests__/factories";
import prisma from "../../../../prisma";
import { Mutation } from "../../../../generated/graphql/types";
import { SIGN_DASRI_WITH_CODE } from "./signUtils";

describe("Mutation.signBsdasri emission with secret code", () => {
  afterEach(resetDatabase);

  it("should deny emission signature if secret code is incorrect", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const {
      user: transporter,
      company: transporterCompany
    } = await userWithCompanyFactory("MEMBER");

    let dasri = await bsdasriFactory({
      ownerId: user.id,
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
        message: "Erreur, le code de sécurité est manquant ou invalide",
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
    dasri = await prisma.bsdasri.findUnique({
      where: { id: dasri.id }
    });
    expect(dasri.status).toEqual("INITIAL");
  });

  it("should put emission signature on a dasri when correct code is provided", async () => {
    const { user: emitter, company } = await userWithCompanyFactory("MEMBER");
    const {
      user: transporter,
      company: transporterCompany
    } = await userWithCompanyFactory("MEMBER");

    const dasri = await bsdasriFactory({
      ownerId: emitter.id,
      opt: {
        ...initialData(company),
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

    const readyTotakeOverDasri = await prisma.bsdasri.findUnique({
      where: { id: dasri.id }
    });
    expect(readyTotakeOverDasri.status).toEqual("SIGNED_BY_PRODUCER");
    expect(readyTotakeOverDasri.emissionSignatureAuthor).toEqual("Marcel");
    expect(readyTotakeOverDasri.emissionSignatureDate).toBeTruthy();
    expect(readyTotakeOverDasri.emissionSignatoryId).toEqual(transporter.id);
    expect(readyTotakeOverDasri.isEmissionTakenOverWithSecretCode).toEqual(
      true
    );
  });
});
