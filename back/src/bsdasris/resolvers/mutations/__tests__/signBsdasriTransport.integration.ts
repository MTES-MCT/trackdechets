import { resetDatabase } from "../../../../../integration-tests/helper";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { BsdasriStatus, WasteAcceptationStatus } from "@prisma/client";
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

  it("should put transport signature on a SIGNED_BY_PRODUCER dasri", async () => {
    const { company: emitterCompany } = await userWithCompanyFactory("MEMBER");
    const {
      user: transporter,
      company: transporterCompany
    } = await userWithCompanyFactory("MEMBER");

    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(emitterCompany),
        ...readyToTakeOverData(transporterCompany),
        status: BsdasriStatus.SIGNED_BY_PRODUCER
      }
    });
    const { mutate } = makeClient(transporter); // transporter

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
  });

  it("should mark a dasri as refused when transporter acceptation is refused", async () => {
    const { company: emitterCompany } = await userWithCompanyFactory("MEMBER");
    const {
      user: transporter,
      company: transporterCompany
    } = await userWithCompanyFactory("MEMBER");

    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(emitterCompany),
        ...readyToTakeOverData(transporterCompany),
        transporterAcceptationStatus: WasteAcceptationStatus.REFUSED,
        transporterWasteRefusalReason: "J'en veux pas",
        transporterWasteRefusedWeightValue: 66,
        status: BsdasriStatus.SIGNED_BY_PRODUCER
      }
    });
    const { mutate } = makeClient(transporter); // transporter

    await mutate<Pick<Mutation, "signBsdasri">>(SIGN_DASRI, {
      variables: {
        id: dasri.id,
        input: { type: "TRANSPORT", author: "Jimmy" }
      }
    });

    const readyTotakeOverDasri = await prisma.bsdasri.findUnique({
      where: { id: dasri.id }
    });
    expect(readyTotakeOverDasri.status).toEqual("REFUSED");
    expect(readyTotakeOverDasri.transporterTransportSignatureAuthor).toEqual(
      "Jimmy"
    );
    expect(readyTotakeOverDasri.transporterTransportSignatureDate).toBeTruthy();
    expect(readyTotakeOverDasri.transportSignatoryId).toEqual(transporter.id);
  });
});
