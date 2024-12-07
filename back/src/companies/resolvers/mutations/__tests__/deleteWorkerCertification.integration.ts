import { resetDatabase } from "../../../../../integration-tests/helper";
import { prisma } from "@td/prisma";
import { AuthType } from "../../../../auth";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { Mutation } from "@td/codegen-back";

describe("{ mutation { deleteworkerCertification } }", () => {
  afterEach(() => resetDatabase());

  it("should delete a worker certification", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");

    const certification = {
      hasSubSectionFour: true,
      hasSubSectionThree: true,
      certificationNumber: "AAA",
      validityLimit: new Date().toISOString(),
      organisation: "AFNOR Certification"
    };
    const createdCertification = await prisma.workerCertification.create({
      data: certification
    });

    await prisma.company.update({
      data: {
        workerCertification: {
          connect: { id: createdCertification.id }
        }
      },
      where: { id: company.id }
    });

    const { mutate } = makeClient({ ...user, auth: AuthType.Session });

    const mutation = `
      mutation {
        deleteWorkerCertification(
          input: {
            id: "${createdCertification.id}"
          }
        ){
          id
        }
      }
    `;

    const { data } = await mutate<Pick<Mutation, "deleteWorkerCertification">>(
      mutation
    );
    expect(data.deleteWorkerCertification.id).toEqual(createdCertification.id);

    expect(await prisma.workerCertification.count()).toEqual(0);
  });
});
