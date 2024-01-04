import { resetDatabase } from "../../../../integration-tests/helper";
import { prisma } from "@td/prisma";
import { runInTransaction } from "../helper";

describe("Repository.helper", () => {
  afterEach(resetDatabase);

  it("should run addAfterCommitCallbacks after transaction is comitted", async () => {
    expect.assertions(1);

    const siret = "1".padStart(14);
    await runInTransaction(transaction => {
      transaction.addAfterCommitCallback(async () => {
        const companyCreatedInTransaction =
          await prisma.company.findUniqueOrThrow({
            where: { siret }
          });

        expect(companyCreatedInTransaction.siret).toBe(siret);
      });

      return transaction.company.create({
        data: {
          orgId: siret,
          siret,
          name: "",
          securityCode: 1,
          verificationCode: "1111"
        }
      });
    });
  });

  it("should run all addAfterCommitCallbacks even if one fails", async () => {
    expect.assertions(1);

    const siret = "1".padStart(14);
    await runInTransaction(transaction => {
      transaction.addAfterCommitCallback(() => {
        throw new Error("Callback throwing");
      });

      transaction.addAfterCommitCallback(async () => {
        const companyCreatedInTransaction =
          await prisma.company.findUniqueOrThrow({
            where: { siret }
          });

        expect(companyCreatedInTransaction.siret).toBe(siret);
      });

      return transaction.company.create({
        data: {
          orgId: siret,
          name: "",
          siret,
          securityCode: 1,
          verificationCode: "1111"
        }
      });
    });
  });
});
