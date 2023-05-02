import { userWithCompanyFactory } from "../../../../__tests__/factories";
import { resetDatabase } from "../../../../../integration-tests/helper";
import makeClient from "../../../../__tests__/testClient";
import { BsdaInput, Mutation } from "../../../../generated/graphql/types";
import { CREATE_BSDA } from "./create.integration";
import { gql } from "apollo-server-core";
import { Company } from "@prisma/client";
import { TestQuery } from "../../../../__tests__/apollo-integration-testing";
import prisma from "../../../../prisma";
import { xDaysAgo } from "../../../../commands/onboarding.helpers";

const TODAY = new Date();
const FOUR_DAYS_AGO = xDaysAgo(TODAY, 4);

const CompanyFragment = gql`
  fragment CompanyFragment on FormCompany {
    name
    siret
    address
    contact
    phone
    mail
  }
`;

export const DUPLICATE_BSDA = gql`
  ${CompanyFragment}

  mutation DuplicateBsda($id: ID!) {
    duplicateBsda(id: $id) {
      id
      status
      emitter {
        company {
          ...CompanyFragment
        }
      }
      transporter {
        company {
          ...CompanyFragment
        }
        recepisse {
          isExempted
          number
          validityLimit
          department
        }
      }
      broker {
        company {
          ...CompanyFragment
        }
        recepisse {
          isExempted
          number
          validityLimit
          department
        }
      }
      worker {
        company {
          ...CompanyFragment
        }
        certification {
          hasSubSectionFour
          hasSubSectionThree
          certificationNumber
          validityLimit
          organisation
        }
      }
      destination {
        company {
          ...CompanyFragment
        }
      }
    }
  }
`;

const buildBsdaInput = (
  emitterCompany: Company,
  transporterCompany: Company,
  brokerCompany: Company,
  workerCompany: Company,
  destinationCompany: Company
): BsdaInput => ({
  emitter: {
    isPrivateIndividual: false,
    company: {
      siret: emitterCompany.siret,
      name: emitterCompany.siret,
      address: emitterCompany.address,
      contact: emitterCompany.contact,
      phone: "emitterContactPhone",
      mail: "emitter@mail.com"
    }
  },
  worker: {
    company: {
      siret: workerCompany.siret,
      name: workerCompany.siret,
      address: workerCompany.address,
      contact: workerCompany.contact,
      phone: "workerContactPhone",
      mail: "worker@mail.com"
    },
    certification: {
      hasSubSectionFour: true,
      hasSubSectionThree: true,
      certificationNumber: "WORKER-CERTIFICATION-NBR",
      validityLimit: TODAY.toISOString() as any,
      organisation: "GLOBAL CERTIFICATION"
    }
  },
  transporter: {
    company: {
      siret: transporterCompany.siret,
      name: transporterCompany.siret,
      address: transporterCompany.address,
      contact: transporterCompany.contact,
      phone: "transporterContactPhone",
      mail: "transporter@mail.com"
    },
    recepisse: {
      isExempted: true,
      number: "TRANSPORTER-RECEIPT-NUMBER",
      validityLimit: TODAY.toISOString() as any,
      department: "TRANSPORTER-RECEIPT-DEPARTMENT"
    }
  },
  broker: {
    company: {
      siret: brokerCompany.siret,
      name: brokerCompany.siret,
      address: brokerCompany.address,
      contact: brokerCompany.contact,
      phone: "brokerContactPhone",
      mail: "broker@mail.com"
    },
    recepisse: {
      isExempted: true,
      number: "BROKER-RECEIPT-NUMBER",
      validityLimit: TODAY.toISOString() as any,
      department: "BROKER-RECEIPT-DEPARTMENT"
    }
  },
  waste: {
    code: "06 07 01*",
    adr: "ADR",
    pop: true,
    consistence: "SOLIDE",
    familyCode: "Code famille",
    materialName: "A material",
    sealNumbers: ["1", "2"]
  },
  packagings: [{ quantity: 1, type: "PALETTE_FILME" }],
  weight: { isEstimate: true, value: 1.2 },
  destination: {
    cap: "A cap",
    plannedOperationCode: "D 9",
    company: {
      siret: destinationCompany.siret,
      name: destinationCompany.siret,
      address: destinationCompany.address,
      contact: destinationCompany.contact,
      phone: "destinationContactPhone",
      mail: "destination@mail.com"
    }
  }
});

const createCompaniesAndBsda = async () => {
  // Companies with their initial data
  const { user: emitter, company: emitterCompany } =
    await userWithCompanyFactory();
  const { company: transporterCompany } = await userWithCompanyFactory(
    "ADMIN",
    {
      transporterReceipt: {
        create: {
          receiptNumber: "TRANSPORTER-RECEIPT-NUMBER",
          validityLimit: TODAY.toISOString() as any,
          department: "TRANSPORTER- RECEIPT-DEPARTMENT"
        }
      }
    }
  );
  const { company: brokerCompany } = await userWithCompanyFactory("ADMIN", {
    brokerReceipt: {
      create: {
        receiptNumber: "BROKER-RECEIPT-NUMBER",
        validityLimit: TODAY.toISOString() as any,
        department: "BROKER-RECEIPT-DEPARTMENT"
      }
    }
  });
  const { company: workerCompany } = await userWithCompanyFactory("ADMIN", {
    workerCertification: {
      create: {
        hasSubSectionFour: true,
        hasSubSectionThree: true,
        certificationNumber: "WORKER-CERTIFICATION-NBR",
        validityLimit: TODAY.toISOString() as any,
        organisation: "GLOBAL CERTIFICATION"
      }
    }
  });
  const { company: destinationCompany } = await userWithCompanyFactory();

  const input = buildBsdaInput(
    emitterCompany,
    transporterCompany,
    brokerCompany,
    workerCompany,
    destinationCompany
  );

  // Create the BSDA
  const { mutate } = makeClient(emitter);
  const { data: createBsdaData } = await mutate<Pick<Mutation, "createBsda">>(
    CREATE_BSDA,
    {
      variables: {
        input
      }
    }
  );

  return {
    mutate,
    emitterCompany,
    transporterCompany,
    brokerCompany,
    workerCompany,
    destinationCompany,
    bsda: createBsdaData.createBsda
  };
};

const duplicateBsda = (mutate: TestQuery, bsdaId: string) => {
  return mutate<Pick<Mutation, "duplicateBsda">>(DUPLICATE_BSDA, {
    variables: {
      id: bsdaId
    }
  });
};

describe("Mutation.Bsda.duplicate", () => {
  afterEach(async () => {
    await resetDatabase();
  });

  test("should duplicate a bsda", async () => {
    // Given
    const { mutate, bsda } = await createCompaniesAndBsda();

    // When
    const { errors, data: duplicateBsdaData } = await duplicateBsda(
      mutate,
      bsda.id
    );

    // Then
    expect(errors).toBeUndefined();
    expect(duplicateBsdaData.duplicateBsda.status).toBe("INITIAL");
  });

  test("transporter updates his company info > duplicated bsda should have the updated data", async () => {
    // Given
    const { mutate, transporterCompany, bsda } = await createCompaniesAndBsda();

    await prisma.company.update({
      where: {
        id: transporterCompany.id
      },
      data: {
        name: "UPDATED-TRANSPORTER-NAME",
        address: "UPDATED-TRANSPORTER-ADRESS",
        contact: "UPDATED-TRANSPORTER-CONTACT",
        contactPhone: "UPDATED-TRANSPORTER-PHONE",
        contactEmail: "UPDATED-TRANSPORTER-MAIL"
      }
    });

    // When
    const { errors, data: duplicateBsdaData } = await duplicateBsda(
      mutate,
      bsda.id
    );

    // Then
    expect(errors).toBeUndefined();
    expect(duplicateBsdaData.duplicateBsda.status).toBe("INITIAL");

    // Check transporter info
    const transporter = duplicateBsdaData.duplicateBsda.transporter?.company;
    expect(transporter?.name).toEqual("UPDATED-TRANSPORTER-NAME");
    expect(transporter?.address).toEqual("UPDATED-TRANSPORTER-ADRESS");
    expect(transporter?.contact).toEqual("UPDATED-TRANSPORTER-CONTACT");
    expect(transporter?.phone).toEqual("UPDATED-TRANSPORTER-PHONE");
    expect(transporter?.mail).toEqual("UPDATED-TRANSPORTER-MAIL");
  });

  test("transporter updates his recepisse > duplicated bsda should have the updated data", async () => {
    // Given
    const { mutate, transporterCompany, bsda } = await createCompaniesAndBsda();

    await prisma.company.update({
      where: {
        id: transporterCompany.id
      },
      data: {
        transporterReceipt: {
          update: {
            receiptNumber: "UPDATED-TRANSPORTER-RECEIPT-NUMBER",
            validityLimit: FOUR_DAYS_AGO.toISOString(),
            department: "UPDATED-TRANSPORTER-RECEIPT-DEPARTMENT"
          }
        }
      }
    });

    // When
    const { errors, data: duplicateBsdaData } = await duplicateBsda(
      mutate,
      bsda.id
    );

    // Then
    expect(errors).toBeUndefined();
    expect(duplicateBsdaData.duplicateBsda.status).toBe("INITIAL");

    // Check receipt
    const recepisse = duplicateBsdaData.duplicateBsda.transporter?.recepisse;
    expect(recepisse?.department).toEqual(
      "UPDATED-TRANSPORTER-RECEIPT-DEPARTMENT"
    );
    expect(recepisse?.validityLimit).toEqual(FOUR_DAYS_AGO.toISOString());
    expect(recepisse?.number).toEqual("UPDATED-TRANSPORTER-RECEIPT-NUMBER");
  });

  test("broker updates his recepisse > duplicated bsda should have the updated data", async () => {
    // Given
    const { mutate, brokerCompany, bsda } = await createCompaniesAndBsda();

    await prisma.company.update({
      where: {
        id: brokerCompany.id
      },
      data: {
        brokerReceipt: {
          update: {
            receiptNumber: "UPDATED-BROKER-RECEIPT-NUMBER",
            validityLimit: FOUR_DAYS_AGO.toISOString(),
            department: "UPDATED-BROKER-RECEIPT-DEPARTMENT"
          }
        }
      }
    });

    // When
    const { errors, data: duplicateBsdaData } = await duplicateBsda(
      mutate,
      bsda.id
    );

    // Then
    expect(errors).toBeUndefined();
    expect(duplicateBsdaData.duplicateBsda.status).toBe("INITIAL");

    // Check receipt
    const recepisse = duplicateBsdaData.duplicateBsda.broker?.recepisse;
    expect(recepisse?.department).toEqual("UPDATED-BROKER-RECEIPT-DEPARTMENT");
    expect(recepisse?.validityLimit).toEqual(FOUR_DAYS_AGO.toISOString());
    expect(recepisse?.number).toEqual("UPDATED-BROKER-RECEIPT-NUMBER");
  });

  test("broker updates his company info > duplicated bsda should have the updated data", async () => {
    // Given
    const { mutate, brokerCompany, bsda } = await createCompaniesAndBsda();

    await prisma.company.update({
      where: {
        id: brokerCompany.id
      },
      data: {
        name: "UPDATED-BROKER-NAME",
        address: "UPDATED-BROKER-ADRESS",
        contact: "UPDATED-BROKER-CONTACT",
        contactPhone: "UPDATED-BROKER-PHONE",
        contactEmail: "UPDATED-BROKER-MAIL"
      }
    });

    // When
    const { errors, data: duplicateBsdaData } = await duplicateBsda(
      mutate,
      bsda.id
    );

    // Then
    expect(errors).toBeUndefined();
    expect(duplicateBsdaData.duplicateBsda.status).toBe("INITIAL");

    // Check transporter info
    const broker = duplicateBsdaData.duplicateBsda.broker?.company;
    expect(broker?.name).toEqual("UPDATED-BROKER-NAME");
    expect(broker?.address).toEqual("UPDATED-BROKER-ADRESS");
    expect(broker?.contact).toEqual("UPDATED-BROKER-CONTACT");
    expect(broker?.phone).toEqual("UPDATED-BROKER-PHONE");
    expect(broker?.mail).toEqual("UPDATED-BROKER-MAIL");
  });

  test("emitter updates his company info > duplicated bsda should have the updated data", async () => {
    // Given
    const { mutate, emitterCompany, bsda } = await createCompaniesAndBsda();

    await prisma.company.update({
      where: {
        id: emitterCompany.id
      },
      data: {
        name: "UPDATED-EMITTER-NAME",
        address: "UPDATED-EMITTER-ADRESS",
        contact: "UPDATED-EMITTER-CONTACT",
        contactPhone: "UPDATED-EMITTER-PHONE",
        contactEmail: "UPDATED-EMITTER-MAIL"
      }
    });

    // When
    const { errors, data: duplicateBsdaData } = await duplicateBsda(
      mutate,
      bsda.id
    );

    // Then
    expect(errors).toBeUndefined();
    expect(duplicateBsdaData.duplicateBsda.status).toBe("INITIAL");

    // Check transporter info
    const emitter = duplicateBsdaData.duplicateBsda.emitter?.company;
    expect(emitter?.name).toEqual("UPDATED-EMITTER-NAME");
    expect(emitter?.address).toEqual("UPDATED-EMITTER-ADRESS");
    expect(emitter?.contact).toEqual("UPDATED-EMITTER-CONTACT");
    expect(emitter?.phone).toEqual("UPDATED-EMITTER-PHONE");
    expect(emitter?.mail).toEqual("UPDATED-EMITTER-MAIL");
  });

  test("worker updates his company info > duplicated bsda should have the updated data", async () => {
    // Given
    const { mutate, workerCompany, bsda } = await createCompaniesAndBsda();

    await prisma.company.update({
      where: {
        id: workerCompany.id
      },
      data: {
        name: "UPDATED-WORKER-NAME",
        address: "UPDATED-WORKER-ADRESS",
        contact: "UPDATED-WORKER-CONTACT",
        contactPhone: "UPDATED-WORKER-PHONE",
        contactEmail: "UPDATED-WORKER-MAIL"
      }
    });

    // When
    const { errors, data: duplicateBsdaData } = await duplicateBsda(
      mutate,
      bsda.id
    );

    // Then
    expect(errors).toBeUndefined();
    expect(duplicateBsdaData.duplicateBsda.status).toBe("INITIAL");

    // Check transporter info
    const worker = duplicateBsdaData.duplicateBsda.worker?.company;
    expect(worker?.name).toEqual("UPDATED-WORKER-NAME");
    expect(worker?.address).toEqual("UPDATED-WORKER-ADRESS");
    expect(worker?.contact).toEqual("UPDATED-WORKER-CONTACT");
    expect(worker?.phone).toEqual("UPDATED-WORKER-PHONE");
    expect(worker?.mail).toEqual("UPDATED-WORKER-MAIL");
  });

  test("worker updates certification > duplicated bsda should have the updated data", async () => {
    // Given
    const { mutate, workerCompany, bsda } = await createCompaniesAndBsda();

    await prisma.company.update({
      where: {
        id: workerCompany.id
      },
      data: {
        workerCertification: {
          update: {
            hasSubSectionFour: false,
            hasSubSectionThree: false,
            certificationNumber: "UPDATED-WORKER-CERTIFICATION-NBR",
            validityLimit: FOUR_DAYS_AGO.toISOString() as any,
            organisation: "AFNOR Certification"
          }
        }
      }
    });

    // When
    const { errors, data: duplicateBsdaData } = await duplicateBsda(
      mutate,
      bsda.id
    );

    // Then
    expect(errors).toBeUndefined();
    expect(duplicateBsdaData.duplicateBsda.status).toBe("INITIAL");

    // Check transporter info
    const certification = duplicateBsdaData.duplicateBsda.worker?.certification;
    expect(certification?.hasSubSectionFour).toEqual(false);
    expect(certification?.hasSubSectionThree).toEqual(false);
    expect(certification?.certificationNumber).toEqual(
      "UPDATED-WORKER-CERTIFICATION-NBR"
    );
    expect(certification?.validityLimit).toEqual(FOUR_DAYS_AGO.toISOString());
    expect(certification?.organisation).toEqual("AFNOR Certification");
  });
});
