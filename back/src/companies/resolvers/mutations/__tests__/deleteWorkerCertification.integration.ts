import { resetDatabase } from "../../../../../integration-tests/helper";
import { prisma } from "@td/prisma";
import { AuthType } from "../../../../auth/auth";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import type { Mutation } from "@td/codegen-back";

describe("{ mutation { deleteworkerCertification } }", () => {
  afterEach(() => resetDatabase());

  it("should delete a worker certification", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");

    const { mutate } = makeClient({ ...user, auth: AuthType.Session });

    const mutation = `
      mutation {
        deleteWorkerCertification(
          input: {
            id: "${company.workerCertificationId}"
          }
        ){
          id
        }
      }
    `;

    expect(company.workerCertificationId).not.toBeNull();

    const { data } = await mutate<Pick<Mutation, "deleteWorkerCertification">>(
      mutation
    );

    expect(data.deleteWorkerCertification.id).toEqual(
      company.workerCertificationId
    );

    expect(await prisma.workerCertification.count()).toEqual(0);
  });
});
