import { resetDatabase } from "../../../../../integration-tests/helper";
import {
  transporterReceiptFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { BsdasriStatus, WasteAcceptationStatus } from "@prisma/client";
import {
  bsdasriFactory,
  initialData,
  readyToPublishData,
  readyToTakeOverData
} from "../../../__tests__/factories";
import { prisma } from "@td/prisma";
import { Mutation } from "../../../../generated/graphql/types";

import { SIGN_DASRI } from "./signUtils";

describe("Mutation.signBsdasri transport", () => {
  afterEach(resetDatabase);

  it("should put transport signature on a SIGNED_BY_PRODUCER dasri", async () => {
    const { company: emitterCompany } = await userWithCompanyFactory("MEMBER");
    const { user: transporter, company: transporterCompany } =
      await userWithCompanyFactory("MEMBER");
    const { company: destinationCompany } = await userWithCompanyFactory(
      "MEMBER"
    );
    await transporterReceiptFactory({ company: transporterCompany });
    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(emitterCompany),
        ...readyToPublishData(destinationCompany),
        ...readyToTakeOverData(transporterCompany),
        emitterEmissionSignatureDate: new Date(),
        emitterEmissionSignatureAuthor: "Producteur",
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

    const readyTotakeOverDasri = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: dasri.id }
    });
    expect(readyTotakeOverDasri.status).toEqual("SENT");
    expect(readyTotakeOverDasri.transporterTransportSignatureAuthor).toEqual(
      "Jimmy"
    );
    expect(readyTotakeOverDasri.transporterTransportSignatureDate).toBeTruthy();
    expect(readyTotakeOverDasri.transportSignatoryId).toEqual(transporter.id);
  });

  it("should put transport signature on a SIGNED_BY_PRODUCER dasri", async () => {
    const { company: emitterCompany } = await userWithCompanyFactory("MEMBER");
    const { user: transporter, company: transporterCompany } =
      await userWithCompanyFactory("MEMBER");
    const { company: destinationCompany } = await userWithCompanyFactory(
      "MEMBER"
    );

    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(emitterCompany),
        ...readyToPublishData(destinationCompany),
        ...readyToTakeOverData(transporterCompany),
        emitterEmissionSignatureDate: new Date(),
        transporterRecepisseIsExempted: true,
        emitterEmissionSignatureAuthor: "Producteur",
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

    const readyTotakeOverDasri = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: dasri.id }
    });
    expect(readyTotakeOverDasri.status).toEqual("SENT");
    expect(readyTotakeOverDasri.transporterTransportSignatureAuthor).toEqual(
      "Jimmy"
    );
    expect(readyTotakeOverDasri.transporterTransportSignatureDate).toBeTruthy();
    expect(readyTotakeOverDasri.transportSignatoryId).toEqual(transporter.id);
  });

  it("should not allow the transport signature when recepisse is absent", async () => {
    const { company: emitterCompany } = await userWithCompanyFactory("MEMBER");
    const { user: transporter, company: transporterCompany } =
      await userWithCompanyFactory("MEMBER");
    const { company: destinationCompany } = await userWithCompanyFactory(
      "MEMBER"
    );

    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(emitterCompany),
        ...readyToPublishData(destinationCompany),
        ...readyToTakeOverData(transporterCompany),
        emitterEmissionSignatureDate: new Date(),
        emitterEmissionSignatureAuthor: "Producteur",
        status: BsdasriStatus.SIGNED_BY_PRODUCER
      }
    });
    const { mutate } = makeClient(transporter); // transporter

    const { errors } = await mutate<Pick<Mutation, "signBsdasri">>(SIGN_DASRI, {
      variables: {
        id: dasri.id,
        input: { type: "TRANSPORT", author: "Jimmy" }
      }
    });
    expect(errors[0].message).toMatch(
      "Transporteur: le département associé au récépissé est obligatoire - l'établissement doit renseigner son récépissé dans Trackdéchets"
    );
    expect(errors[0].message).toMatch(
      "Transporteur: le numéro de récépissé est obligatoire - l'établissement doit renseigner son récépissé dans Trackdéchets"
    );
    expect(errors[0].message).toMatch(
      "Transporteur: la date limite de validité du récépissé est obligatoire - l'établissement doit renseigner son récépissé dans Trackdéchets"
    );
  });

  it("should mark a dasri as refused when transporter acceptation is refused", async () => {
    const { company: emitterCompany } = await userWithCompanyFactory("MEMBER");
    const { user: transporter, company: transporterCompany } =
      await userWithCompanyFactory("MEMBER");
    const { company: destinationCompany } = await userWithCompanyFactory(
      "MEMBER"
    );

    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(emitterCompany),
        ...readyToPublishData(destinationCompany),
        ...readyToTakeOverData(transporterCompany),
        transporterAcceptationStatus: WasteAcceptationStatus.REFUSED,
        transporterWasteRefusalReason: "J'en veux pas",
        transporterWasteRefusedWeightValue: 66,
        transporterRecepisseIsExempted: true,
        status: BsdasriStatus.SIGNED_BY_PRODUCER,
        emitterEmissionSignatureDate: new Date(),
        emitterEmissionSignatureAuthor: "Producteur"
      }
    });
    const { mutate } = makeClient(transporter); // transporter

    await mutate<Pick<Mutation, "signBsdasri">>(SIGN_DASRI, {
      variables: {
        id: dasri.id,
        input: { type: "TRANSPORT", author: "Jimmy" }
      }
    });

    const readyTotakeOverDasri = await prisma.bsdasri.findUniqueOrThrow({
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
