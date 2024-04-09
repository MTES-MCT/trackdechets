import { prisma } from "@td/prisma";
import { bsdaFactory } from "../../__tests__/factories";
import {
  getCurrentSignatureType,
  getZodTransporters,
  prismaToZodBsda
} from "../helpers";

describe("graphqlInputToZodTransporters", () => {
  it("should return transporters from DB in the same order", async () => {
    const bsdaTransporter1 = await prisma.bsdaTransporter.create({
      data: { number: 0, transporterCompanySiret: "1" }
    });
    const bsdaTransporter2 = await prisma.bsdaTransporter.create({
      data: { number: 0, transporterCompanySiret: "2" }
    });

    const zodTransporters = await getZodTransporters({
      transporters: [bsdaTransporter2.id, bsdaTransporter1.id]
    });
    expect(zodTransporters).toEqual([
      expect.objectContaining({
        id: bsdaTransporter2.id,
        transporterCompanySiret: "2"
      }),
      expect.objectContaining({
        id: bsdaTransporter1.id,
        transporterCompanySiret: "1"
      })
    ]);
  });
});

describe("getCurrentSignatureType", () => {
  test("before EMISSION", async () => {
    const bsda = await bsdaFactory({});
    const signatureType = getCurrentSignatureType(prismaToZodBsda(bsda));
    expect(signatureType).toBeUndefined();
  });

  test("after EMISSION", async () => {
    const bsda = await bsdaFactory({
      opt: {
        status: "SIGNED_BY_PRODUCER",
        emitterEmissionSignatureDate: new Date()
      }
    });
    const signatureType = getCurrentSignatureType(prismaToZodBsda(bsda));
    expect(signatureType).toEqual("EMISSION");
  });

  test("after WORK", async () => {
    const bsda = await bsdaFactory({
      opt: {
        status: "SIGNED_BY_WORKER",
        emitterEmissionSignatureDate: new Date(),
        workerWorkSignatureDate: new Date()
      }
    });
    const signatureType = getCurrentSignatureType(prismaToZodBsda(bsda));
    expect(signatureType).toEqual("WORK");
  });

  test("after TRANSPORT", async () => {
    const bsda = await bsdaFactory({
      opt: {
        status: "SENT",
        emitterEmissionSignatureDate: new Date(),
        workerWorkSignatureDate: new Date(),
        transporterTransportSignatureDate: new Date()
      },
      transporterOpt: {
        transporterTransportSignatureDate: new Date()
      }
    });
    const signatureType = getCurrentSignatureType(prismaToZodBsda(bsda));
    expect(signatureType).toEqual("TRANSPORT");
  });

  test("after OPERATION", async () => {
    const bsda = await bsdaFactory({
      opt: {
        status: "PROCESSED",
        emitterEmissionSignatureDate: new Date(),
        workerWorkSignatureDate: new Date(),
        transporterTransportSignatureDate: new Date(),
        destinationOperationSignatureDate: new Date()
      },
      transporterOpt: {
        transporterTransportSignatureDate: new Date()
      }
    });
    const signatureType = getCurrentSignatureType(prismaToZodBsda(bsda));
    expect(signatureType).toEqual("OPERATION");
  });

  test("after TRANSPORT when no worker", async () => {
    const bsda = await bsdaFactory({
      opt: {
        status: "SENT",
        emitterEmissionSignatureDate: new Date(),
        transporterTransportSignatureDate: new Date()
      },
      transporterOpt: {
        transporterTransportSignatureDate: new Date()
      }
    });
    const signatureType = getCurrentSignatureType(prismaToZodBsda(bsda));
    expect(signatureType).toEqual("TRANSPORT");
  });

  test("after OPERATION when no worker", async () => {
    const bsda = await bsdaFactory({
      opt: {
        status: "PROCESSED",
        emitterEmissionSignatureDate: new Date(),
        transporterTransportSignatureDate: new Date(),
        destinationOperationSignatureDate: new Date()
      },
      transporterOpt: {
        transporterTransportSignatureDate: new Date()
      }
    });
    const signatureType = getCurrentSignatureType(prismaToZodBsda(bsda));
    expect(signatureType).toEqual("OPERATION");
  });
});
