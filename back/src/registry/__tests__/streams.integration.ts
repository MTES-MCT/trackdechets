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
import { getFullForm } from "../../forms/database";
import { indexForm } from "../../forms/elastic";
import { indexBsda } from "../../bsda/elastic";
import { indexBsdasri } from "../../bsdasris/elastic";
import { indexBsvhu } from "../../bsvhu/elastic";
import { indexBsff } from "../../bsffs/elastic";

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

    await Promise.all(bsds.map(async bsd => indexForm(await getFullForm(bsd))));

    // create 5 incoming BSDAs
    const bsdas = await Promise.all(
      Array(5)
        .fill(1)
        .map(() =>
          bsdaFactory({
            opt: {
              destinationCompanySiret: destination.company.siret,
              destinationReceptionDate: new Date(),
              destinationOperationSignatureDate: new Date()
            }
          })
        )
    );

    await Promise.all(
      bsdas.map(bsda => indexBsda({ ...bsda, intermediaries: [] }))
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

    await Promise.all(bsdasris.map(bsdasri => indexBsdasri(bsdasri)));

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

    await Promise.all(bsvhus.map(bsvhu => indexBsvhu(bsvhu)));

    // create 5 incoming BSFFs
    const bsffs = await Promise.all(
      Array(5)
        .fill(1)
        .map(() =>
          createBsffAfterReception(
            { emitter, transporter, destination },
            {
              destinationCompanySiret: destination.company.siret,
              destinationReceptionDate: new Date(),
              destinationReceptionSignatureDate: new Date()
            }
          )
        )
    );

    await Promise.all(bsffs.map(bsff => indexBsff(bsff)));

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
