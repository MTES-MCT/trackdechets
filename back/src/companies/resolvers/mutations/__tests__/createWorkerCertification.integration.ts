import { resetDatabase } from "../../../../../integration-tests/helper";
import { prisma } from "@td/prisma";
import { AuthType } from "../../../../auth";
import { userFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import type { Mutation } from "@td/codegen-back";

describe("{ mutation { createWorkerCertification } }", () => {
  afterEach(() => resetDatabase());

  it("should create a worker certification", async () => {
    const certification = {
      hasSubSectionFour: true,
      hasSubSectionThree: true,
      certificationNumber: "AAA",
      validityLimit: new Date().toISOString(),
      organisation: "AFNOR Certification"
    };

    const user = await userFactory();

    const mutation = `
      mutation {
        createWorkerCertification(
          input: {
            hasSubSectionFour: ${certification.hasSubSectionFour}
            hasSubSectionThree: ${certification.hasSubSectionThree}
            certificationNumber: "${certification.certificationNumber}"
            validityLimit: "${certification.validityLimit}"
            organisation: "${certification.organisation}"
          }
          ) { hasSubSectionFour hasSubSectionThree certificationNumber validityLimit organisation }
        }`;
    const { mutate } = makeClient({ ...user, auth: AuthType.Session });

    const { data } = await mutate<Pick<Mutation, "createWorkerCertification">>(
      mutation
    );

    expect(await prisma.workerCertification.count()).toEqual(1);

    expect(data.createWorkerCertification).toEqual(certification);
  });

  it("should create a worker certification without subSectionThree", async () => {
    const certification = {
      hasSubSectionFour: true,
      hasSubSectionThree: false
    };

    const user = await userFactory();

    const mutation = `
      mutation {
        createWorkerCertification(
          input: {
            hasSubSectionFour: ${certification.hasSubSectionFour}
            hasSubSectionThree: ${certification.hasSubSectionThree}
          }
          ) { hasSubSectionFour hasSubSectionThree certificationNumber validityLimit organisation }
        }`;
    const { mutate } = makeClient({ ...user, auth: AuthType.Session });

    await mutate<Pick<Mutation, "createWorkerCertification">>(mutation);

    expect(await prisma.workerCertification.count()).toEqual(1);
  });

  it("should fail if it has sub section three without every details", async () => {
    const certification = {
      hasSubSectionFour: false,
      hasSubSectionThree: true,
      //certificationNumber: "AAA",
      validityLimit: new Date().toISOString(),
      organisation: "AFNOR Certification"
    };

    const user = await userFactory();

    const mutation = `
      mutation {
        createWorkerCertification(
          input: {
            hasSubSectionFour: ${certification.hasSubSectionFour}
            hasSubSectionThree: ${certification.hasSubSectionThree}
            validityLimit: "${certification.validityLimit}"
            organisation: "${certification.organisation}"
          }
          ) { hasSubSectionFour hasSubSectionThree certificationNumber validityLimit organisation }
        }`;
    const { mutate } = makeClient({ ...user, auth: AuthType.Session });

    const { errors } = await mutate<
      Pick<Mutation, "createWorkerCertification">
    >(mutation);

    expect(errors[0].message).toBe(
      "certificationNumber est un champ requis et doit avoir une valeur"
    );
  });

  it("should fail if the organisation name is not recognised", async () => {
    const certification = {
      hasSubSectionFour: true,
      hasSubSectionThree: true,
      certificationNumber: "AAA",
      validityLimit: new Date().toISOString(),
      organisation: "NOT ALLOWED"
    };

    const user = await userFactory();

    const mutation = `
      mutation {
        createWorkerCertification(
          input: {
            hasSubSectionFour: ${certification.hasSubSectionFour}
            hasSubSectionThree: ${certification.hasSubSectionThree}
            certificationNumber: "${certification.certificationNumber}"
            validityLimit: "${certification.validityLimit}"
            organisation: "${certification.organisation}"
          }
          ) { hasSubSectionFour hasSubSectionThree certificationNumber validityLimit organisation }
        }`;
    const { mutate } = makeClient({ ...user, auth: AuthType.Session });

    const { errors } = await mutate<
      Pick<Mutation, "createWorkerCertification">
    >(mutation);

    expect(errors[0].message).toContain(
      "L'organisme doit prendre l'une des valeurs suivantes: AFNOR Certification, GLOBAL CERTIFICATION, QUALIBAT"
    );
  });
});
