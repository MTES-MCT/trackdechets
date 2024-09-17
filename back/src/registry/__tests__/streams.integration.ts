import { wastesReader } from "../streams";
import { formFactory, userWithCompanyFactory } from "../../__tests__/factories";
import { Company, User, UserRole } from "@prisma/client";
import {
  refreshElasticSearch,
  resetDatabase
} from "../../../integration-tests/helper";
import { bsdaFactory } from "../../bsda/__tests__/factories";
import { bsdasriFactory } from "../../bsdasris/__tests__/factories";
import { bsvhuFactory } from "../../bsvhu/__tests__/factories.vhu";
import { createBsffAfterReception } from "../../bsffs/__tests__/factories";
import { getFormForElastic, indexForm } from "../../forms/elastic";
import { getBsdaForElastic, indexBsda } from "../../bsda/elastic";
import { getBsdasriForElastic, indexBsdasri } from "../../bsdasris/elastic";
import { getBsvhuForElastic, indexBsvhu } from "../../bsvhu/elastic";
import { getBsffForElastic, indexBsff } from "../../bsffs/elastic";

describe("wastesReader", () => {
  let emitter: { user: User; company: Company };
  let transporter: { user: User; company: Company };
  let destination: { user: User; company: Company };

  afterAll(resetDatabase);

  beforeAll(async () => {
    emitter = await userWithCompanyFactory(UserRole.ADMIN, {
      companyTypes: {
        set: ["PRODUCER"]
      }
    });

    transporter = await userWithCompanyFactory(UserRole.ADMIN, {
      companyTypes: {
        set: ["TRANSPORTER"]
      }
    });

    destination = await userWithCompanyFactory(UserRole.ADMIN, {
      companyTypes: {
        set: ["WASTEPROCESSOR"]
      }
    });
  });

  it("should read wastes in chunks", async () => {
    // create 5 incoming BSDDs
    const bsds = await Promise.all(
      Array(5)
        .fill(1)
        .map(() =>
          formFactory({
            ownerId: destination.user.id,
            opt: {
              recipientCompanySiret: destination.company.siret,
              receivedAt: new Date()
            }
          })
        )
    );

    await Promise.all(
      bsds.map(async bsd => indexForm(await getFormForElastic(bsd)))
    );

    // create 5 incoming BSDAs
    const bsdas = await Promise.all(
      Array(5)
        .fill(1)
        .map(() =>
          bsdaFactory({
            userId: destination.user.id,
            opt: {
              destinationCompanySiret: destination.company.siret,
              destinationReceptionDate: new Date(),
              destinationOperationSignatureDate: new Date()
            }
          })
        )
    );

    await Promise.all(
      bsdas.map(async bsda => {
        const bsdaForElastic = await getBsdaForElastic(bsda);
        return indexBsda(bsdaForElastic);
      })
    );

    // create 5 incoming BSDASRIs
    const bsdasris = await Promise.all(
      Array(5)
        .fill(1)
        .map(() =>
          bsdasriFactory({
            opt: {
              destinationCompanySiret: destination.company.siret,
              destinationReceptionDate: new Date(),
              destinationReceptionSignatureDate: new Date()
            }
          })
        )
    );

    const bsdasrisForElastic = await Promise.all(
      bsdasris.map(b => getBsdasriForElastic(b))
    );
    await Promise.all(bsdasrisForElastic.map(bsdasri => indexBsdasri(bsdasri)));

    // create 5 incoming BSVHUs
    const bsvhus = await Promise.all(
      Array(5)
        .fill(1)
        .map(() =>
          bsvhuFactory({
            opt: {
              destinationCompanySiret: destination.company.siret,
              destinationReceptionDate: new Date(),
              destinationOperationSignatureDate: new Date()
            }
          })
        )
    );

    const bsvhusForElastic = await Promise.all(
      bsvhus.map(bsff => getBsvhuForElastic(bsff))
    );

    await Promise.all(bsvhusForElastic.map(bsvhu => indexBsvhu(bsvhu)));

    // create 5 incoming BSFFs
    const bsffs = await Promise.all(
      Array(5)
        .fill(1)
        .map(() =>
          createBsffAfterReception(
            { emitter, transporter, destination },
            {
              data: {
                destinationCompanySiret: destination.company.siret,
                destinationReceptionDate: new Date(),
                destinationReceptionSignatureDate: new Date()
              }
            }
          )
        )
    );

    const bsffsForElastic = await Promise.all(
      bsffs.map(bsff => getBsffForElastic(bsff))
    );

    await Promise.all(bsffsForElastic.map(bsff => indexBsff(bsff)));

    await refreshElasticSearch();

    // read forms by chunk of 4
    const reader = wastesReader({
      registryType: "INCOMING",
      sirets: [destination.company.siret!],
      chunk: 4
    });

    const incomingWastes: any[] = [];

    reader.on("data", chunk => {
      incomingWastes.push(chunk);
    });

    reader.read();

    // wait until all chunks are consumed
    await new Promise<void>(resolve => {
      reader.on("end", () => resolve());
    });

    expect(incomingWastes).toHaveLength(25);
  }, 30000);
});
