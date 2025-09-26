import { bsvhuFactory } from "./factories.vhu";
import { userWithCompanyFactory } from "../../__tests__/factories";
import { resetDatabase } from "../../../integration-tests/helper";
import { checkBsvhuSealedFields } from "../validation/rules";
import {
  graphQlInputToZodBsvhu,
  prismaToZodBsvhu
} from "../validation/helpers";

describe("edition rules", () => {
  afterAll(resetDatabase);

  it("should be possible to update any fields when BSVHU status is INITIAL", async () => {
    const prismaBsvhu = await bsvhuFactory({
      opt: { status: "INITIAL" }
    });
    const bsvhu = prismaToZodBsvhu(prismaBsvhu);
    const input = await graphQlInputToZodBsvhu({
      emitter: { company: { name: "ACME" } }
    });
    const checked = await checkBsvhuSealedFields(bsvhu, input, {});
    expect(checked).toEqual(expect.arrayContaining(["emitterCompanyName"]));
  });

  it("should not be possible to update a field sealed by emission signature", async () => {
    const prismaBsvhu = await bsvhuFactory({
      opt: {
        status: "SIGNED_BY_PRODUCER",
        emitterEmissionSignatureDate: new Date()
      }
    });
    const bsvhu = prismaToZodBsvhu(prismaBsvhu);
    const input = await graphQlInputToZodBsvhu({
      emitter: { company: { name: "ACME" } }
    });
    const checkfn = checkBsvhuSealedFields(bsvhu, input, {});
    await expect(checkfn).rejects.toThrow(
      "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés : La raison sociale de l'émetteur"
    );
  });

  it("should be possible for the emitter to update a field sealed by emission signature", async () => {
    const emitter = await userWithCompanyFactory("MEMBER");
    const prismaBsvhu = await bsvhuFactory({
      opt: {
        status: "SIGNED_BY_PRODUCER",
        emitterCompanySiret: emitter.company.siret,
        emitterEmissionSignatureDate: new Date()
      }
    });
    const bsvhu = prismaToZodBsvhu(prismaBsvhu);
    const input = await graphQlInputToZodBsvhu({
      emitter: { company: { name: "ACME" } }
    });
    const checked = await checkBsvhuSealedFields(bsvhu, input, {
      user: emitter.user
    });
    expect(checked).toEqual(expect.arrayContaining(["emitterCompanyName"]));
  });

  it("should be possible to re-send same data on a field sealed by emission signature", async () => {
    const prismaBsvhu = await bsvhuFactory({
      opt: {
        status: "SIGNED_BY_PRODUCER",
        emitterEmissionSignatureDate: new Date()
      }
    });
    const bsvhu = prismaToZodBsvhu(prismaBsvhu);
    const input = await graphQlInputToZodBsvhu({
      emitter: { company: { siret: bsvhu.emitterCompanySiret } }
    });
    const checked = await checkBsvhuSealedFields(bsvhu, input, {});
    expect(checked).toEqual(expect.arrayContaining([]));
  });

  it("should be possible to update a field not yet sealed by emission signature", async () => {
    const prismaBsvhu = await bsvhuFactory({
      opt: {
        status: "SIGNED_BY_PRODUCER",
        emitterEmissionSignatureDate: new Date()
      }
    });
    const bsvhu = prismaToZodBsvhu(prismaBsvhu);
    const input = await graphQlInputToZodBsvhu({
      transporter: { transport: { takenOverAt: new Date() } }
    });
    const checked = await checkBsvhuSealedFields(bsvhu, input, {});
    expect(checked).toEqual(expect.arrayContaining(["transporters"]));
  });

  it("should not be possible to update a field sealed by transporter signature", async () => {
    const prismaBsvhu = await bsvhuFactory({
      opt: {
        status: "SENT",
        emitterEmissionSignatureDate: new Date(),
        transporters: {
          create: { transporterTransportSignatureDate: new Date(), number: 1 }
        }
      }
    });
    const bsvhu = prismaToZodBsvhu(prismaBsvhu);
    const input = await graphQlInputToZodBsvhu({
      transporter: {
        transport: {
          takenOverAt: new Date()
        }
      }
    });
    const checkfn = checkBsvhuSealedFields(bsvhu, input, {});
    await expect(checkfn).rejects.toThrow(
      "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés : Le transporteur n°1 a déjà signé le BSVHU, il ne peut pas être supprimé ou modifié"
    );
  });

  it("should be possible to re-send same data on a field sealed by transporter signature", async () => {
    const prismaBsvhu = await bsvhuFactory({
      opt: {
        status: "SENT",
        emitterEmissionSignatureDate: new Date(),
        transporters: {
          create: { transporterTransportSignatureDate: new Date(), number: 1 }
        }
      }
    });
    const bsvhu = prismaToZodBsvhu(prismaBsvhu);
    const input = await graphQlInputToZodBsvhu({
      transporter: {
        company: { siret: bsvhu.transporters?.[0].transporterCompanySiret }
      }
    });
    // emulate what happens in mergeInputAndParseBsvhuAsync
    // without this checkBsvhuSealedFields can't compare the old transporter infos with the new
    input.transporters = bsvhu.transporters?.map((t, idx) => {
      if (idx === 0) {
        return { ...t, ...input.transporters![0] };
      }
      return t;
    });
    const checked = await checkBsvhuSealedFields(bsvhu, input, {});
    expect(checked).toEqual(expect.arrayContaining([]));
  });

  it("should be possible to update a field not yet sealed by transport signature", async () => {
    const prismaBsvhu = await bsvhuFactory({
      opt: {
        status: "SENT",
        emitterEmissionSignatureDate: new Date(),
        transporters: {
          create: { transporterTransportSignatureDate: new Date(), number: 1 }
        }
      }
    });
    const bsvhu = prismaToZodBsvhu(prismaBsvhu);
    const input = await graphQlInputToZodBsvhu({
      destination: { reception: { date: new Date("2021-01-01") } }
    });
    const checked = await checkBsvhuSealedFields(bsvhu, input, {});
    expect(checked).toEqual(
      expect.arrayContaining(["destinationReceptionDate"])
    );
  });

  it("should not be possible to update a field sealed by operation signature", async () => {
    const prismaBsvhu = await bsvhuFactory({
      opt: {
        status: "PROCESSED",
        emitterEmissionSignatureDate: new Date(),
        transporters: {
          create: { transporterTransportSignatureDate: new Date(), number: 1 }
        },
        destinationOperationSignatureDate: new Date()
      }
    });
    const bsvhu = prismaToZodBsvhu(prismaBsvhu);
    const input = await graphQlInputToZodBsvhu({
      destination: { operation: { date: new Date("2021-01-01") } }
    });
    const checkfn = checkBsvhuSealedFields(bsvhu, input, {});
    await expect(checkfn).rejects.toThrow(
      "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés : La date de l'opération"
    );
  });
});
