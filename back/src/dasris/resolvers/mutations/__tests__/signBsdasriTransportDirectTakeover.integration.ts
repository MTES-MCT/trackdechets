import { resetDatabase } from "../../../../../integration-tests/helper";
import { ErrorCode } from "../../../../common/errors";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { BsdasriStatus } from "@prisma/client";
import {
  bsdasriFactory,
  initialData,
  readyToTakeOverData
} from "../../../__tests__/factories";
import prisma from "../../../../prisma";

import { SIGN_DASRI } from "./signUtils";

describe("Mutation.signBsdasri transport", () => {
  afterEach(resetDatabase);

  it("should put transport signature on an INITIAL dasri if allowed by emitter company", async () => {
    const {
      user: emitter,
      company: emitterCompany
    } = await userWithCompanyFactory("MEMBER", {
      allowDasriTakeOverWithoutSignature: true // company allow takeover without signature
    });

    const {
      user: transporter,
      company: transporterCompany
    } = await userWithCompanyFactory("MEMBER");

    const dasri = await bsdasriFactory({
      ownerId: emitter.id,
      opt: {
        ...initialData(emitterCompany),
        ...readyToTakeOverData(transporterCompany),
        status: BsdasriStatus.INITIAL
      }
    });
    const { mutate } = makeClient(transporter);

    await mutate(SIGN_DASRI, {
      variables: {
        id: dasri.id,
        input: { type: "TRANSPORT", author: "Jimmy" }
      }
    });

    const readyTotakeOverDasri = await prisma.bsdasri.findUnique({
      where: { id: dasri.id }
    });
    expect(readyTotakeOverDasri.status).toEqual("SENT");
    expect(readyTotakeOverDasri.transportSignatureAuthor).toEqual("Jimmy");
    expect(readyTotakeOverDasri.transportSignatureDate).toBeTruthy();
    expect(readyTotakeOverDasri.transportSignatoryId).toEqual(transporter.id);
    expect(readyTotakeOverDasri.isEmissionDirectTakenOver).toEqual(true);
  });

  it("should not put transport signature on an INITIAL dasri if required field is missing", async () => {
    const {
      user: emitter,
      company: emitterCompany
    } = await userWithCompanyFactory("MEMBER", {
      allowDasriTakeOverWithoutSignature: true // company allow takeover without signature
    });

    const {
      user: transporter,
      company: transporterCompany
    } = await userWithCompanyFactory("MEMBER");

    // missing onu code
    const dasri = await bsdasriFactory({
      ownerId: emitter.id,
      opt: {
        ...initialData(emitterCompany),
        ...readyToTakeOverData(transporterCompany),
        wasteDetailsOnuCode: null,
        status: BsdasriStatus.INITIAL
      }
    });
    const { mutate } = makeClient(transporter);

    const { errors } = await mutate(SIGN_DASRI, {
      variables: {
        id: dasri.id,
        input: { type: "TRANSPORT", author: "Jimmy" }
      }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "wasteDetailsOnuCode est un champ requis et doit avoir une valeur"
      })
    ]);
  });

  it("should not put transport signature on an INITIAL dasri if not allowed by emitter company", async () => {
    const {
      user: emitter,
      company: emitterCompany
    } = await userWithCompanyFactory("MEMBER"); // company forbid takeover without signature

    const {
      user: transporter,
      company: transporterCompany
    } = await userWithCompanyFactory("MEMBER");

    let dasri = await bsdasriFactory({
      ownerId: emitter.id,
      opt: {
        ...initialData(emitterCompany),
        ...readyToTakeOverData(transporterCompany),
        status: BsdasriStatus.INITIAL
      }
    });
    const { mutate } = makeClient(transporter);

    const { errors } = await mutate(SIGN_DASRI, {
      variables: {
        id: dasri.id,
        input: { type: "TRANSPORT", author: "Jimmy" }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Erreur, l'émetteur n'a pas autorisé l'emport par le transporteur sans l'avoir préalablement signé",

        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);

    dasri = await prisma.bsdasri.findUnique({
      where: { id: dasri.id }
    });
    expect(dasri.status).toEqual("INITIAL"); // status did not change
  });
});
