import { prisma } from "@td/prisma";
import { companyFactory } from "../../../__tests__/factories";
import { bsdaFactory } from "../../../bsda/__tests__/factories";
import {
  AdministrativeTransferArgs,
  processAdministrativeTransferJob
} from "../administrativeTransfer";
import { Job } from "bull";
import { BsdaStatus } from "@td/prisma";
import { resetDatabase } from "../../../../integration-tests/helper";

describe("processAdministrativeTransferJob", () => {
  afterEach(resetDatabase);

  it("should transfer BSDAs with status AWAITING_CHILD", async () => {
    // Given
    const fromCompany = await companyFactory();
    const toCompany = await companyFactory();

    const bsda = await bsdaFactory({
      opt: {
        status: "AWAITING_CHILD",
        destinationCompanySiret: fromCompany.siret
      }
    });

    // When
    const job = {
      data: {
        fromOrgId: fromCompany.siret,
        toOrgId: toCompany.siret
      }
    } as Job<AdministrativeTransferArgs>;
    await processAdministrativeTransferJob(job);

    // Then
    const updatedBsda = await prisma.bsda.findFirstOrThrow({
      where: {
        id: bsda.id
      }
    });
    expect(updatedBsda.destinationCompanySiret).toBe(toCompany.siret);
  });

  it.each([
    BsdaStatus.CANCELED,
    BsdaStatus.INITIAL,
    BsdaStatus.PROCESSED,
    BsdaStatus.REFUSED,
    BsdaStatus.SENT,
    BsdaStatus.SIGNED_BY_PRODUCER,
    BsdaStatus.SIGNED_BY_WORKER
  ])("should not transfer BSDAs with status %p", async status => {
    // Given
    const fromCompany = await companyFactory();
    const toCompany = await companyFactory();

    const bsda = await bsdaFactory({
      opt: {
        status,
        destinationCompanySiret: fromCompany.siret
      }
    });

    // When
    const job = {
      data: {
        fromOrgId: fromCompany.siret,
        toOrgId: toCompany.siret
      }
    } as Job<AdministrativeTransferArgs>;
    await processAdministrativeTransferJob(job);

    // Then
    const updatedBsda = await prisma.bsda.findFirstOrThrow({
      where: {
        id: bsda.id
      }
    });
    expect(updatedBsda.destinationCompanySiret).toBe(fromCompany.siret);
  });

  it("should not transfer BSDA that has nothing to do with companies", async () => {
    // Given
    const fromCompany = await companyFactory();
    const toCompany = await companyFactory();
    const otherCompany = await companyFactory();

    const bsda = await bsdaFactory({
      opt: {
        status: "AWAITING_CHILD",
        destinationCompanySiret: otherCompany.siret
      }
    });

    // When
    const job = {
      data: {
        fromOrgId: fromCompany.siret,
        toOrgId: toCompany.siret
      }
    } as Job<AdministrativeTransferArgs>;
    await processAdministrativeTransferJob(job);

    // Then
    const updatedBsda = await prisma.bsda.findFirstOrThrow({
      where: {
        id: bsda.id
      }
    });
    expect(updatedBsda.destinationCompanySiret).toBe(otherCompany.siret);
  });
});
