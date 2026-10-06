import { resetDatabase } from "../../../../../integration-tests/helper";
import {
  UserWithCompany,
  siretify,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import { createBsffAfterOperation } from "../../../__tests__/factories";
import { parseBsffAsync } from "..";
import { ZodBsff, ZodBsffPackaging } from "../schema";

jest.mock("../../../../companies/search");

describe("validation > BSFF RECONDITIONNEMENT", () => {
  let producer: UserWithCompany;
  let transporter: UserWithCompany;
  let ttr: UserWithCompany;

  beforeEach(async () => {
    producer = await userWithCompanyFactory("MEMBER", {
      companyTypes: ["PRODUCER"]
    });
    transporter = await userWithCompanyFactory("MEMBER", {
      transporterReceipt: {
        create: {
          receiptNumber: "recepisse",
          validityLimit: new Date(),
          department: "07"
        }
      },
      companyTypes: ["TRANSPORTER"]
    });
    // installation TTR : destinataire des BSFF initiaux, émettrice du reconditionnement
    ttr = await userWithCompanyFactory("MEMBER", {
      companyTypes: ["COLLECTOR"]
    });
  });

  afterEach(resetDatabase);

  const newPackaging = (numero: string, weight = 15): ZodBsffPackaging => ({
    type: "BOUTEILLE",
    volume: 20,
    weight,
    numero,
    emissionNumero: numero
  });

  const reconditionnement = (
    repackaging: string[],
    packagings: ZodBsffPackaging[] = [newPackaging("NEW1")]
  ): ZodBsff => ({
    type: "RECONDITIONNEMENT",
    emitterCompanySiret: ttr.company.siret,
    repackaging,
    packagings
  });

  const sourceBsff = (packagingData = {}) =>
    createBsffAfterOperation(
      { emitter: producer, transporter, destination: ttr },
      { packagingData: { operationCode: "D14", ...packagingData } }
    );

  const expectError = async (zodBsff: ZodBsff, message: string) => {
    expect.assertions(1);
    try {
      await parseBsffAsync(zodBsff);
    } catch (e) {
      expect(e.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ message })])
      );
    }
  };

  describe("contenants sources (RG7)", () => {
    it("should accept D14 sources received by the emitter", async () => {
      const source = await sourceBsff();
      const parsed = await parseBsffAsync(
        reconditionnement(source.packagings.map(p => p.id))
      );
      expect(parsed.packagings).toHaveLength(1);
      expect(parsed.packagings![0].previousPackagings).toEqual(
        source.packagings.map(p => p.id)
      );
    });

    it("should throw if a source packaging has a final operation (not D14)", async () => {
      const source = await sourceBsff({ operationCode: "R2" });
      await expectError(
        reconditionnement(source.packagings.map(p => p.id)),
        expect.stringContaining(
          "Une opération de traitement finale a été déclarée sur le contenant"
        ) as unknown as string
      );
    });

    it("should throw if a source packaging was already used in another BSFF", async () => {
      const source = await sourceBsff();
      const packagingIds = source.packagings.map(p => p.id);
      // premier reconditionnement : rattache les sources
      await createBsffAfterOperation(
        { emitter: ttr, transporter, destination: producer },
        {
          data: { type: "RECONDITIONNEMENT" },
          previousPackagings: source.packagings
        }
      );
      await expectError(
        reconditionnement(packagingIds),
        expect.stringContaining(
          "a déjà été réexpédié, reconditionné ou groupé dans un autre BSFF"
        ) as unknown as string
      );
    });

    it("should throw if the source BSFF was not processed by the emitter", async () => {
      const source = await sourceBsff();
      const otherTtr = await userWithCompanyFactory("MEMBER", {
        companyTypes: ["COLLECTOR"]
      });
      await expectError(
        {
          ...reconditionnement(source.packagings.map(p => p.id)),
          emitterCompanySiret: otherTtr.company.siret
        },
        expect.stringContaining(
          "n'a pas été traité sur l'installation émettrice du nouveau BSFF"
        ) as unknown as string
      );
    });

    it("should throw if the list of source packagings is empty", async () => {
      await expectError(
        reconditionnement([]),
        "Vous devez saisir des contenants en transit en cas de groupement, reconditionnement ou réexpédition"
      );
    });

    it("should throw if more than one new packaging is created", async () => {
      const source = await sourceBsff();
      await expectError(
        reconditionnement(
          source.packagings.map(p => p.id),
          [newPackaging("NEW1"), newPackaging("NEW2")]
        ),
        "Conditionnements : un reconditionnement ne peut produire qu'un seul nouveau contenant"
      );
    });
  });

  describe("transfert des détenteurs (RG9)", () => {
    const detenteurA = {
      detenteurCompanyName: "A",
      detenteurCompanySiret: siretify(1),
      detenteurCompanyAddress: "1 rue A",
      detenteurIsPrivateIndividual: false
    };
    const particulier = {
      detenteurCompanyName: "Jean Dupont",
      detenteurCompanySiret: null,
      detenteurCompanyAddress: "3 rue des Lilas",
      detenteurIsPrivateIndividual: true
    };

    it("should copy detenteurs from all sources onto the new packaging, without duplicates", async () => {
      const source1 = await sourceBsff({
        detenteurs: { create: [detenteurA, particulier] }
      });
      const source2 = await sourceBsff({
        detenteurs: { create: [detenteurA] }
      });

      const parsed = await parseBsffAsync(
        reconditionnement(
          [...source1.packagings, ...source2.packagings].map(p => p.id)
        )
      );

      const detenteurs = parsed.packagings![0].detenteurs!;
      expect(detenteurs).toHaveLength(2);
      expect(detenteurs.map(d => d.company?.name)).toEqual([
        "A",
        "Jean Dupont"
      ]);
    });

    it("should ignore detenteurs sent by the client (locked fields)", async () => {
      const source = await sourceBsff({
        detenteurs: { create: [detenteurA] }
      });

      const parsed = await parseBsffAsync(
        reconditionnement(
          source.packagings.map(p => p.id),
          [
            {
              ...newPackaging("NEW1"),
              detenteurs: [
                {
                  company: { name: "Intrus", siret: siretify(9) },
                  isPrivateIndividual: false
                }
              ]
            }
          ]
        )
      );

      const detenteurs = parsed.packagings![0].detenteurs!;
      expect(detenteurs.map(d => d.company?.name)).toEqual(["A"]);
    });

    it("should recompute detenteurs when the list of sources changes", async () => {
      const source1 = await sourceBsff({
        detenteurs: { create: [detenteurA] }
      });
      const source2 = await sourceBsff({
        detenteurs: { create: [particulier] }
      });

      const first = await parseBsffAsync(
        reconditionnement(source1.packagings.map(p => p.id))
      );
      expect(
        first.packagings![0].detenteurs!.map(d => d.company?.name)
      ).toEqual(["A"]);

      const second = await parseBsffAsync(
        reconditionnement(
          [...source1.packagings, ...source2.packagings].map(p => p.id)
        )
      );
      expect(
        second.packagings![0].detenteurs!.map(d => d.company?.name)
      ).toEqual(["A", "Jean Dupont"]);
    });
  });
});
