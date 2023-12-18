import { Company } from "@prisma/client";
import { resetDatabase } from "../../../integration-tests/helper";
import prisma from "../../prisma";
import {
  companyFactory} from "../../__tests__/factories";
import { getBsdaForElastic, toBsdElastic } from "../elastic";
import { BsdElastic } from "../../common/elastic";
import { bsdaFactory } from "./factories";

describe("toBsdElastic > companies Names & Sirets", () => {
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
    transporter = await companyFactory({ name: "Transporter" });
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
        destinationCompanyName: destination.name,
        destinationCompanySiret: destination.siret,
        destinationOperationNextDestinationCompanyName: nextDestination.name,
        destinationOperationNextDestinationCompanySiret: nextDestination.siret,
        ecoOrganismeName: ecoOrganisme.name,
        ecoOrganismeSiret: ecoOrganisme.siret,
        brokerCompanyName: broker.name,
        brokerCompanySiret: broker.siret,
      }
    });

    // Add transporters & intermediaries
    await prisma.bsda.update({
      where: { id: bsda.id },
      data: {
        intermediaries: {
          createMany: {
            data: [{
              siret: intermediary1.siret!,
              name: intermediary1.name!,
              contact: intermediary1.contact!,
            },
            {
              siret: intermediary2.siret!,
              name: intermediary2.name!,
              contact: intermediary2.contact!,
            },
          ]}
        },
      }
    })

    const bsdaForElastic = await getBsdaForElastic(bsda);

    // When
    elasticBsda = toBsdElastic(bsdaForElastic);
  });

  test("companiesNames > should contain the names of ALL BSDA companies", async () => {
    // Then
    expect(elasticBsda.companiesNames).toContain(emitter.name);
    expect(elasticBsda.companiesNames).toContain(worker.name);
    expect(elasticBsda.companiesNames).toContain(transporter.name);
    expect(elasticBsda.companiesNames).toContain(destination.name);
    expect(elasticBsda.companiesNames).toContain(broker.name);
    expect(elasticBsda.companiesNames).toContain(ecoOrganisme.name);
    expect(elasticBsda.companiesNames).toContain(nextDestination.name);
    expect(elasticBsda.companiesNames).toContain(intermediary1.name);
    expect(elasticBsda.companiesNames).toContain(intermediary2.name);
  });

  test("companiesSirets > should contain the sirets of ALL BSDA companies", async () => {
    // Then
    expect(elasticBsda.companiesSirets).toContain(emitter.siret);
    expect(elasticBsda.companiesSirets).toContain(worker.siret);
    expect(elasticBsda.companiesSirets).toContain(transporter.siret);
    expect(elasticBsda.companiesSirets).toContain(destination.siret);
    expect(elasticBsda.companiesSirets).toContain(broker.siret);
    expect(elasticBsda.companiesSirets).toContain(ecoOrganisme.siret);
    expect(elasticBsda.companiesSirets).toContain(nextDestination.siret);
    expect(elasticBsda.companiesSirets).toContain(intermediary1.siret);
    expect(elasticBsda.companiesSirets).toContain(intermediary2.siret);
  });
});