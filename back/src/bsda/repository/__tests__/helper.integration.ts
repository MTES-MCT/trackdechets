import { resetDatabase } from "../../../../integration-tests/helper";
import prisma from "../../../prisma";
import { runInTransaction } from "../../../common/repository/helper";

describe("Repository.helper", () => {
  afterEach(resetDatabase);

  it("should run addAfterCommitCallbacks after transaction is comitted", async () => {
    expect.assertions(1);

    const siret = "1".padStart(14);
    await runInTransaction(transaction => {
      transaction.addAfterCommitCallback(async () => {
        const companyCreatedInTransaction = await prisma.company.findUnique({
          where: { siret }
        });

        expect(companyCreatedInTransaction.siret).toBe(siret);
      });

      return transaction.company.create({
        data: {
          siret,
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
        const companyCreatedInTransaction = await prisma.company.findUnique({
          where: { siret }
        });

        expect(companyCreatedInTransaction.siret).toBe(siret);
      });

      return transaction.company.create({
        data: {
          siret,
          securityCode: 1,
          verificationCode: "1111"
        }
      });
    });
  });
});
