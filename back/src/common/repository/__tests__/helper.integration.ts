import { Company } from "@prisma/client";
import { resetDatabase } from "../../../../integration-tests/helper";
import prisma from "../../../prisma";
import { userFactory } from "../../../__tests__/factories";
import { transactionWrapper } from "../helper";
import { RepositoryFnBuilder } from "../types";

describe("Repository.helper", () => {
  afterEach(resetDatabase);

  it("should run addAfterCommitCallbacks after transaction is comitted", async () => {
    expect.assertions(1);
    const siret = "1".padStart(14);

    const user = await userFactory();

    const buildCreateCompany: RepositoryFnBuilder<Company> =
      deps => async () => {
        deps.prisma.addAfterCommitCallback(async () => {
          const companyCreatedInTransaction = await prisma.company.findUnique({
            where: { siret }
          });

          expect(companyCreatedInTransaction.siret).toBe(siret);
        });

        return deps.prisma.company.create({
          data: {
            siret,
            securityCode: 1,
            verificationCode: "1111"
          }
        });
      };

    await transactionWrapper(buildCreateCompany, {
      user
    })();
  });

  it("should run all addAfterCommitCallbacks even if one fails", async () => {
    expect.assertions(1);
    const user = await userFactory();

    const siret = "1".padStart(14);

    const buildCreateCompany: RepositoryFnBuilder<Company> =
      deps => async () => {
        deps.prisma.addAfterCommitCallback(() => {
          throw new Error("Callback throwing");
        });

        deps.prisma.addAfterCommitCallback(async () => {
          const companyCreatedInTransaction = await prisma.company.findUnique({
            where: { siret }
          });

          expect(companyCreatedInTransaction.siret).toBe(siret);
        });

        return deps.prisma.company.create({
          data: {
            siret,
            securityCode: 1,
            verificationCode: "1111"
          }
        });
      };

    await transactionWrapper(buildCreateCompany, {
      user
    })();
  });
});
