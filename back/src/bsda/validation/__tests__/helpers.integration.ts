import { bsdaFactory } from "../../__tests__/factories";
import { getCurrentSignatureType, prismaToZodBsda } from "../helpers";

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
