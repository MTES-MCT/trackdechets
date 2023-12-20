import { Company } from "@prisma/client";
import { resetDatabase } from "../../../integration-tests/helper";
import prisma from "../../prisma";
import { companyFactory } from "../../__tests__/factories";
import { getBsdaForElastic, toBsdElastic } from "../elastic";
import { BsdElastic } from "../../common/elastic";
import { bsdaFactory } from "./factories";

describe("toBsdElastic > companies Names & OrgIds", () => {
  afterEach(resetDatabase);

  let emitter: Company;
  let worker: Company;
  let destination: Company;
  let intermediary1: Company;
  let intermediary2: Company;
  let transporter: Company;
  let nextDestination: Company;
  let ecoOrganisme: Company;
  let broker: Company;
  let bsda: any;
  let elasticBsda: BsdElastic;

  beforeAll(async () => {
    // Given
    emitter = await companyFactory({ name: "Emitter" });
    worker = await companyFactory({ name: "Worker" });
    destination = await companyFactory({ name: "Destination" });
    intermediary1 = await companyFactory({ name: "Intermediaire 1" });
    intermediary2 = await companyFactory({ name: "Intermediaire 2" });
    transporter = await companyFactory({
      name: "Transporter",
      vatNumber: "VAT Transporter"
    });
    nextDestination = await companyFactory({ name: "Next destination" });
    ecoOrganisme = await companyFactory({ name: "Eco organisme" });
    broker = await companyFactory({ name: "Broker" });

    bsda = await bsdaFactory({
      opt: {
        emitterCompanyName: emitter.name,
        emitterCompanySiret: emitter.siret,
        workerCompanyName: worker.name,
        workerCompanySiret: worker.siret,
        transporterCompanyName: transporter.name,
        transporterCompanySiret: transporter.siret,
        transporterCompanyVatNumber: transporter.vatNumber,
        destinationCompanyName: destination.name,
        destinationCompanySiret: destination.siret,
        destinationOperationNextDestinationCompanyName: nextDestination.name,
        destinationOperationNextDestinationCompanySiret: nextDestination.siret,
        ecoOrganismeName: ecoOrganisme.name,
        ecoOrganismeSiret: ecoOrganisme.siret,
        brokerCompanyName: broker.name,
        brokerCompanySiret: broker.siret
      }
    });

    // Add transporters & intermediaries
    await prisma.bsda.update({
      where: { id: bsda.id },
      data: {
        intermediaries: {
          createMany: {
            data: [
              {
                siret: intermediary1.siret!,
                name: intermediary1.name!,
                contact: intermediary1.contact!
              },
              {
                siret: intermediary2.siret!,
                name: intermediary2.name!,
                contact: intermediary2.contact!
              }
            ]
          }
        }
      }
    });

    const bsdaForElastic = await getBsdaForElastic(bsda);

    // When
    elasticBsda = toBsdElastic(bsdaForElastic);
  });

  test("companyNames > should contain the names of ALL BSDA companies", async () => {
    // Then
    expect(elasticBsda.companyNames).toContain(emitter.name);
    expect(elasticBsda.companyNames).toContain(worker.name);
    expect(elasticBsda.companyNames).toContain(transporter.name);
    expect(elasticBsda.companyNames).toContain(destination.name);
    expect(elasticBsda.companyNames).toContain(broker.name);
    expect(elasticBsda.companyNames).toContain(ecoOrganisme.name);
    expect(elasticBsda.companyNames).toContain(nextDestination.name);
    expect(elasticBsda.companyNames).toContain(intermediary1.name);
    expect(elasticBsda.companyNames).toContain(intermediary2.name);
  });

  test("companyOrgIds > should contain the orgIds of ALL BSDA companies", async () => {
    // Then
    expect(elasticBsda.companyOrgIds).toContain(emitter.siret);
    expect(elasticBsda.companyOrgIds).toContain(worker.siret);
    expect(elasticBsda.companyOrgIds).toContain(transporter.siret);
    expect(elasticBsda.companyOrgIds).toContain(transporter.vatNumber);
    expect(elasticBsda.companyOrgIds).toContain(destination.siret);
    expect(elasticBsda.companyOrgIds).toContain(broker.siret);
    expect(elasticBsda.companyOrgIds).toContain(ecoOrganisme.siret);
    expect(elasticBsda.companyOrgIds).toContain(nextDestination.siret);
    expect(elasticBsda.companyOrgIds).toContain(intermediary1.siret);
    expect(elasticBsda.companyOrgIds).toContain(intermediary2.siret);
  });
});
