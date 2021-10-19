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
import { Mutation } from "../../../../generated/graphql/types";

import { SIGN_DASRI } from "./signUtils";

describe("Mutation.signBsdasri transport", () => {
  afterEach(resetDatabase);

  it("should put transport signature on an INITIAL dasri if allowed by emitter company", async () => {
    const { company: emitterCompany } = await userWithCompanyFactory("MEMBER", {
      allowBsdasriTakeOverWithoutSignature: true // company allow takeover without signature
    });

    const {
      user: transporter,
      company: transporterCompany
    } = await userWithCompanyFactory("MEMBER");

    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(emitterCompany),
        ...readyToTakeOverData(transporterCompany),
        status: BsdasriStatus.INITIAL
      }
    });
    const { mutate } = makeClient(transporter);

    await mutate<Pick<Mutation, "signBsdasri">>(SIGN_DASRI, {
      variables: {
        id: dasri.id,
        input: { type: "TRANSPORT", author: "Jimmy" }
      }
    });

    const readyTotakeOverDasri = await prisma.bsdasri.findUnique({
      where: { id: dasri.id }
    });
    expect(readyTotakeOverDasri.status).toEqual("SENT");
    expect(readyTotakeOverDasri.transporterTransportSignatureAuthor).toEqual(
      "Jimmy"
    );
    expect(readyTotakeOverDasri.transporterTransportSignatureDate).toBeTruthy();
    expect(readyTotakeOverDasri.transportSignatoryId).toEqual(transporter.id);
    expect(readyTotakeOverDasri.isEmissionDirectTakenOver).toEqual(true);
  });

  it("should forbid transport signature on an INITIAL grouping dasri", async () => {
    const { company: emitterCompany } = await userWithCompanyFactory("MEMBER", {
      allowBsdasriTakeOverWithoutSignature: true // company allow takeover without signature
    });

    const {
      user: transporter,
      company: transporterCompany
    } = await userWithCompanyFactory("MEMBER");

    const groupingDasri = await bsdasriFactory({
      opt: {
        ...initialData(emitterCompany),
        ...readyToTakeOverData(transporterCompany),
        status: BsdasriStatus.INITIAL,
        type: "GROUPING"
      }
    });
    const { mutate } = makeClient(transporter);

    const { errors } = await mutate<Pick<Mutation, "signBsdasri">>(SIGN_DASRI, {
      variables: {
        id: groupingDasri.id,
        input: { type: "TRANSPORT", author: "Jimmy" }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "L'emport direct est interdit pour les bordereaux dasri de groupement"
      })
    ]);
  });
  it("should not put transport signature on an INITIAL dasri if required field is missing", async () => {
    const { company: emitterCompany } = await userWithCompanyFactory("MEMBER", {
      allowBsdasriTakeOverWithoutSignature: true // company allow takeover without signature
    });

    const {
      user: transporter,
      company: transporterCompany
    } = await userWithCompanyFactory("MEMBER");

    // missing onu code
    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(emitterCompany),
        ...readyToTakeOverData(transporterCompany),
        wasteAdr: null,
        status: BsdasriStatus.INITIAL
      }
    });
    const { mutate } = makeClient(transporter);

    const { errors } = await mutate<Pick<Mutation, "signBsdasri">>(SIGN_DASRI, {
      variables: {
        id: dasri.id,
        input: { type: "TRANSPORT", author: "Jimmy" }
      }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message: "La mention ADR est obligatoire."
      })
    ]);
  });

  it("should not put transport signature on an INITIAL dasri if not allowed by emitter company", async () => {
    const { company: emitterCompany } = await userWithCompanyFactory("MEMBER"); // company forbid takeover without signature

    const {
      user: transporter,
      company: transporterCompany
    } = await userWithCompanyFactory("MEMBER");

    let dasri = await bsdasriFactory({
      opt: {
        ...initialData(emitterCompany),
        ...readyToTakeOverData(transporterCompany),
        status: BsdasriStatus.INITIAL
      }
    });
    const { mutate } = makeClient(transporter);

    const { errors } = await mutate<Pick<Mutation, "signBsdasri">>(SIGN_DASRI, {
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
