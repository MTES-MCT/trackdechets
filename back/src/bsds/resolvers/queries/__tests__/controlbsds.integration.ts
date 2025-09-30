import { GovernmentPermission } from "@td/prisma";
import {
  refreshElasticSearch,
  resetDatabase
} from "../../../../../integration-tests/helper";
import supertest from "supertest";

import { app } from "../../../../server";
import {
  formFactory,
  userWithCompanyFactory,
  userWithAccessTokenFactory,
  companyFactory,
  siretify,
  bsddTransporterData
} from "../../../../__tests__/factories";
import { Status, WasteAcceptationStatus } from "@td/prisma";
import { getFormForElastic, indexForm } from "../../../../forms/elastic";

import { faker } from "@faker-js/faker";

describe("query controlbsds: governement accounts permissions", () => {
  afterEach(resetDatabase);

  it("should allow user authenticated with a token when tied to a government account with relevant perms", async () => {
    const { user: owner } = await userWithCompanyFactory("MEMBER");
    const request = supertest(app);

    const allowedIP = faker.internet.ipv4();
    // the gov account running the query
    const { accessToken } = await userWithAccessTokenFactory({
      governmentAccount: {
        create: {
          name: "GERICO",
          permissions: [GovernmentPermission.BSDS_CAN_READ_ALL],
          authorizedOrgIds: ["ALL"],
          authorizedIPs: [allowedIP]
        }
      }
    });

    const transporter = await companyFactory();
    const form = await formFactory({
      ownerId: owner.id,
      opt: {
        status: "SENT",
        sentAt: new Date(),
        receivedAt: new Date(),
        transporters: {
          create: {
            ...bsddTransporterData,
            number: 1,
            transporterCompanySiret: transporter.siret
          }
        }
      }
    });

    await indexForm(await getFormForElastic(form));
    await refreshElasticSearch();
    const res = await request
      .post("/")
      .send({
        query: `{ controlBsds(where: {siret: "${transporter.siret}" }) {pageInfo: totalCount}}`
      })
      .set("Authorization", `Bearer ${accessToken}`)
      .set("X-Forwarded-For", allowedIP);
    const { errors, data } = res.body;

    expect(errors).toBeUndefined();
    expect(data.controlBsds.pageInfo).toEqual(1);
  });

  it("should forbid user authenticated with a token when tied to a government account without relevant perms", async () => {
    const { user: owner, company: someCompany } = await userWithCompanyFactory(
      "MEMBER"
    );
    const request = supertest(app);

    const allowedIP = faker.internet.ipv4();
    // the gov account running the query
    const { accessToken } = await userWithAccessTokenFactory({
      governmentAccount: {
        create: {
          name: "GERICO",
          permissions: [GovernmentPermission.REGISTRY_CAN_READ_ALL], // wrong permission
          authorizedOrgIds: ["ALL"],
          authorizedIPs: [allowedIP]
        }
      }
    });
    const form = await formFactory({
      ownerId: owner.id,
      opt: {
        emitterCompanySiret: someCompany.siret,
        status: "SENT",
        sentAt: new Date(),
        receivedAt: new Date()
      }
    });
    await indexForm(await getFormForElastic(form));
    await refreshElasticSearch();
    const res = await request
      .post("/")
      .send({
        query: `{ controlBsds(where: {siret: "${someCompany.siret}" }) {pageInfo: totalCount}}`
      })
      .set("Authorization", `Bearer ${accessToken}`)
      .set("X-Forwarded-For", allowedIP);
    const { errors, data } = res.body;
    expect(data).toBeNull();
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toEqual(`Vous n'êtes pas connecté.`);
  });

  it("should forbid user authenticated with a token if no government account is associated", async () => {
    const { user: owner, company: someCompany } = await userWithCompanyFactory(
      "MEMBER"
    );
    const request = supertest(app);

    const allowedIP = faker.internet.ipv4();
    // the gov account running the query
    const { accessToken } = await userWithAccessTokenFactory();
    const form = await formFactory({
      ownerId: owner.id,
      opt: {
        emitterCompanySiret: someCompany.siret,
        status: Status.SENT,
        sentAt: new Date(),
        receivedAt: new Date()
      }
    });
    await indexForm(await getFormForElastic(form));
    await refreshElasticSearch();
    const res = await request
      .post("/")
      .send({
        query: `{ controlBsds(where: {siret: "${someCompany.siret}" }) {pageInfo: totalCount}}`
      })
      .set("Authorization", `Bearer ${accessToken}`)
      .set("X-Forwarded-For", allowedIP);
    const { errors, data } = res.body;
    expect(data).toBeNull();
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toEqual(`Vous n'êtes pas connecté.`);
  });

  it("should forbid user authenticated with a token tied to a government account when IPs do not match", async () => {
    const { user: owner, company: someCompany } = await userWithCompanyFactory(
      "MEMBER"
    );
    const request = supertest(app);

    const allowedIP = faker.internet.ipv4();
    const userIP = faker.internet.ipv4();
    // the gov account running the query
    const { accessToken } = await userWithAccessTokenFactory({
      governmentAccount: {
        create: {
          name: "GERICO",
          permissions: [GovernmentPermission.BSDS_CAN_READ_ALL],
          authorizedOrgIds: ["ALL"],
          authorizedIPs: [allowedIP] // not user ip
        }
      }
    });
    const form = await formFactory({
      ownerId: owner.id,
      opt: {
        emitterCompanySiret: someCompany.siret,
        status: "SENT",
        sentAt: new Date(),
        receivedAt: new Date()
      }
    });
    await indexForm(await getFormForElastic(form));
    await refreshElasticSearch();
    const res = await request
      .post("/")
      .send({
        query: `{ controlBsds(where: {siret: "${someCompany.siret}" }) {pageInfo: totalCount}}`
      })
      .set("Authorization", `Bearer ${accessToken}`)
      .set("X-Forwarded-For", userIP); // IPs do not match
    const { errors, data } = res.body;
    expect(data).toBeNull();
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toEqual(`Vous n'êtes pas connecté.`);
  });

  it("should filter by siret", async () => {
    const { user: owner } = await userWithCompanyFactory("MEMBER");
    const request = supertest(app);

    const allowedIP = faker.internet.ipv4();
    // the gov account running the query
    const { accessToken } = await userWithAccessTokenFactory({
      governmentAccount: {
        create: {
          name: "GERICO",
          permissions: [GovernmentPermission.BSDS_CAN_READ_ALL],
          authorizedOrgIds: ["ALL"],
          authorizedIPs: [allowedIP]
        }
      }
    });
    const siret1 = siretify(1);
    const testInput_1 = {
      transporterCompanySiret: siret1,
      number: 1,
      takenOverAt: new Date()
    };
    const testInput_2 = {
      transporterCompanySiret: siretify(2),
      number: 1,
      takenOverAt: new Date()
    };
    // the siret we'll search after
    const form1 = await formFactory({
      ownerId: owner.id,
      opt: {
        status: "SENT",
        sentAt: new Date(),
        transporters: { create: testInput_1 }
      }
    });
    // another siret
    const form2 = await formFactory({
      ownerId: owner.id,
      opt: {
        status: "SENT",
        sentAt: new Date(),
        transporters: { create: testInput_2 }
      }
    });

    await indexForm(await getFormForElastic(form1));
    await indexForm(await getFormForElastic(form2));

    await refreshElasticSearch();
    const res = await request
      .post("/")
      .send({
        query: `{ controlBsds(where: {siret: "${siret1}" }) {  
      edges {
        node {
          ... on Form {
            id
          }
        }
      }
        pageInfo: totalCount}}`
      })
      .set("Authorization", `Bearer ${accessToken}`)
      .set("X-Forwarded-For", allowedIP);
    const { errors, data } = res.body;

    expect(errors).toBeUndefined();
    expect(data.controlBsds.pageInfo).toEqual(1);
    // the form matches the siret
    expect(data.controlBsds.edges[0].node.id).toEqual(form1.id);
  });

  it("should only return isCollectedFor and isReturnFor", async () => {
    const { user: owner } = await userWithCompanyFactory("MEMBER");
    const request = supertest(app);

    const allowedIP = faker.internet.ipv4();
    // the gov account running the query
    const { accessToken } = await userWithAccessTokenFactory({
      governmentAccount: {
        create: {
          name: "GERICO",
          permissions: [GovernmentPermission.BSDS_CAN_READ_ALL],
          authorizedOrgIds: ["ALL"],
          authorizedIPs: [allowedIP]
        }
      }
    });
    const siret1 = siretify(1);
    const trsInput = {
      transporterCompanySiret: siret1,
      number: 1
    };

    const formSent = await formFactory({
      ownerId: owner.id,
      opt: {
        status: Status.SENT,
        sentAt: new Date(),
        transporters: { create: { ...trsInput, takenOverAt: new Date() } }
      }
    });

    const formReceived = await formFactory({
      ownerId: owner.id,
      opt: {
        status: Status.RECEIVED,
        wasteAcceptationStatus: WasteAcceptationStatus.ACCEPTED,

        transporters: { create: trsInput },
        receivedAt: new Date()
      }
    });

    const formSealed = await formFactory({
      ownerId: owner.id,
      opt: {
        status: Status.SEALED,

        transporters: { create: trsInput }
      }
    });

    const formRefused = await formFactory({
      ownerId: owner.id,
      opt: {
        status: Status.REFUSED,
        receivedAt: new Date(),
        wasteAcceptationStatus: WasteAcceptationStatus.REFUSED,
        transporters: { create: trsInput }
      }
    });

    await indexForm(await getFormForElastic(formSent));
    await indexForm(await getFormForElastic(formRefused));

    await indexForm(await getFormForElastic(formReceived));
    await indexForm(await getFormForElastic(formSealed));

    await refreshElasticSearch();
    const res = await request
      .post("/")
      .send({
        query: `{ controlBsds(where: {siret: "${siret1}" }) {  
      edges {
        node {
          ... on Form {
            id
          }
        }
      }
        pageInfo: totalCount}}`
      })
      .set("Authorization", `Bearer ${accessToken}`)
      .set("X-Forwarded-For", allowedIP);
    const { errors, data } = res.body;

    expect(errors).toBeUndefined();
    expect(data.controlBsds.pageInfo).toEqual(2);
    // the form matches the siret
    expect(data.controlBsds.edges.map(e => e.node.id).sort()).toEqual([
      formSent.id,

      formRefused.id
    ]);
  });

  it("should filter by siret and plate", async () => {
    const { user: owner } = await userWithCompanyFactory("MEMBER");
    const request = supertest(app);

    const allowedIP = faker.internet.ipv4();
    // the gov account running the query
    const { accessToken } = await userWithAccessTokenFactory({
      governmentAccount: {
        create: {
          name: "GERICO",
          permissions: [GovernmentPermission.BSDS_CAN_READ_ALL],
          authorizedOrgIds: ["ALL"],
          authorizedIPs: [allowedIP]
        }
      }
    });
    const siret1 = siretify(1);
    const trsInput = {
      transporterCompanySiret: siret1,
      number: 1
    };

    const form1 = await formFactory({
      ownerId: owner.id,
      opt: {
        status: "SENT",
        sentAt: new Date(),
        transporters: {
          create: {
            ...trsInput,
            takenOverAt: new Date(),
            transporterNumberPlate: "AZ 23 99"
          }
        }
      }
    });

    const form2 = await formFactory({
      ownerId: owner.id,
      opt: {
        status: "SENT",
        sentAt: new Date(),
        transporters: {
          create: {
            ...trsInput,
            takenOverAt: new Date(),
            transporterNumberPlate: "AZ 23 99"
          }
        }
      }
    });

    const form3 = await formFactory({
      ownerId: owner.id,
      opt: {
        status: "SENT",
        sentAt: new Date(),
        transporters: {
          create: {
            ...trsInput,
            takenOverAt: new Date(),
            transporterNumberPlate: "QS 23 99"
          }
        }
      }
    });

    await indexForm(await getFormForElastic(form1));
    await indexForm(await getFormForElastic(form2));
    await indexForm(await getFormForElastic(form3));

    await refreshElasticSearch();
    const res = await request
      .post("/")
      .send({
        query: `{ controlBsds(where: {siret: "${siret1}" , plate: "AZ 23 99"}) {  
      edges {
        node {
          ... on Form {
            id
          }
        }
      }
        pageInfo: totalCount}}`
      })
      .set("Authorization", `Bearer ${accessToken}`)
      .set("X-Forwarded-For", allowedIP);
    const { errors, data } = res.body;

    expect(errors).toBeUndefined();
    expect(data.controlBsds.pageInfo).toEqual(2);
    // the form matches the plate
    expect(data.controlBsds.edges.map(e => e.node.id).sort()).toEqual([
      form1.id,
      form2.id
    ]);
  });

  it("should filter by plate", async () => {
    const { user: owner } = await userWithCompanyFactory("MEMBER");
    const request = supertest(app);

    const allowedIP = faker.internet.ipv4();
    // the gov account running the query
    const { accessToken } = await userWithAccessTokenFactory({
      governmentAccount: {
        create: {
          name: "GERICO",
          permissions: [GovernmentPermission.BSDS_CAN_READ_ALL],
          authorizedOrgIds: ["ALL"],
          authorizedIPs: [allowedIP]
        }
      }
    });
    const siret1 = siretify(1);
    const siret2 = siretify(2);
    const siret3 = siretify(3);
    const siret4 = siretify(3);

    const form1 = await formFactory({
      ownerId: owner.id,
      opt: {
        status: "SENT",
        sentAt: new Date(),
        transporters: {
          create: {
            transporterCompanySiret: siret1,
            number: 1,
            takenOverAt: new Date(),
            transporterNumberPlate: "AZ 23 99"
          }
        }
      }
    });

    const form2 = await formFactory({
      ownerId: owner.id,
      opt: {
        status: "SENT",
        sentAt: new Date(),
        transporters: {
          create: {
            transporterCompanySiret: siret2,
            number: 1,
            takenOverAt: new Date(),
            transporterNumberPlate: "AZ 23 99"
          }
        }
      }
    });

    const form3 = await formFactory({
      ownerId: owner.id,
      opt: {
        status: "SENT",
        sentAt: new Date(),
        transporters: {
          create: {
            transporterCompanySiret: siret3,
            number: 1,
            takenOverAt: new Date(),
            transporterNumberPlate: "QS 23 99"
          }
        }
      }
    });

    const form4 = await formFactory({
      ownerId: owner.id,
      opt: {
        status: Status.REFUSED,
        receivedAt: new Date(),
        wasteAcceptationStatus: WasteAcceptationStatus.REFUSED,
        transporters: {
          create: {
            transporterCompanySiret: siret4,
            number: 1,
            takenOverAt: new Date(),
            transporterNumberPlate: "AZ 23 99"
          }
        }
      }
    });

    await indexForm(await getFormForElastic(form1));
    await indexForm(await getFormForElastic(form2));
    await indexForm(await getFormForElastic(form3));
    await indexForm(await getFormForElastic(form4));

    await refreshElasticSearch();
    const res = await request
      .post("/")
      .send({
        query: `{ controlBsds(where: {plate: "AZ 23 99"}) {  
      edges {
        node {
          ... on Form {
            id
          }
        }
      }
        pageInfo: totalCount}}`
      })
      .set("Authorization", `Bearer ${accessToken}`)
      .set("X-Forwarded-For", allowedIP);
    const { errors, data } = res.body;

    expect(errors).toBeUndefined();
    expect(data.controlBsds.pageInfo).toEqual(3);
    // the form matches the
    expect(data.controlBsds.edges.map(e => e.node.id).sort()).toEqual([
      form1.id,
      form2.id,
      form4.id
    ]);
  });

  it("should paginate controlbsds query", async () => {
    const { user: owner } = await userWithCompanyFactory("MEMBER");
    const request = supertest(app);

    const allowedIP = faker.internet.ipv4();
    // the gov account running the query
    const { accessToken } = await userWithAccessTokenFactory({
      governmentAccount: {
        create: {
          name: "GERICO",
          permissions: [GovernmentPermission.BSDS_CAN_READ_ALL],
          authorizedOrgIds: ["ALL"],
          authorizedIPs: [allowedIP]
        }
      }
    });
    const siret1 = siretify(1);
    const trsInput = {
      transporterCompanySiret: siret1,
      number: 1
    };

    const form1 = await formFactory({
      ownerId: owner.id,
      opt: {
        status: Status.SENT,
        sentAt: new Date(),
        transporters: { create: { ...trsInput, takenOverAt: new Date() } }
      }
    });

    const form2 = await formFactory({
      ownerId: owner.id,
      opt: {
        status: Status.SENT,
        sentAt: new Date(),
        transporters: { create: { ...trsInput, takenOverAt: new Date() } }
      }
    });

    const form3 = await formFactory({
      ownerId: owner.id,
      opt: {
        status: Status.SENT,
        sentAt: new Date(),
        transporters: { create: { ...trsInput, takenOverAt: new Date() } }
      }
    });

    const form4 = await formFactory({
      ownerId: owner.id,
      opt: {
        status: Status.SENT,
        sentAt: new Date(),
        transporters: { create: { ...trsInput, takenOverAt: new Date() } }
      }
    });

    await indexForm(await getFormForElastic(form1));
    await indexForm(await getFormForElastic(form2));
    await indexForm(await getFormForElastic(form3));
    await indexForm(await getFormForElastic(form4));

    await refreshElasticSearch();
    const res = await request
      .post("/")
      .send({
        query: `{ controlBsds(where: {siret: "${siret1}" }, first: 2) {  
      edges {
        node {
          ... on Form {
            id
          }
        }
      }
        pageInfo: totalCount}}`
      })
      .set("Authorization", `Bearer ${accessToken}`)
      .set("X-Forwarded-For", allowedIP);
    const { errors, data } = res.body;

    expect(errors).toBeUndefined();

    expect(data.controlBsds.pageInfo).toEqual(4);
    // the form matches the siret
    expect(data.controlBsds.edges.map(e => e.node.id).sort()).toEqual([
      form1.id,
      form2.id
    ]);

    // second page

    const res2 = await request
      .post("/")
      .send({
        query: `{ controlBsds(where: {siret: "${siret1}" }, first: 2, after:"${form2.id}") {  
      edges {
        node {
          ... on Form {
            id
          }
        }
      }
        pageInfo: totalCount}}`
      })
      .set("Authorization", `Bearer ${accessToken}`)
      .set("X-Forwarded-For", allowedIP);
    const { errors: errors2, data: data2 } = res2.body;

    expect(errors2).toBeUndefined();

    expect(data2.controlBsds.pageInfo).toEqual(4);
    // the form matches the siret
    expect(data2.controlBsds.edges.map(e => e.node.id).sort()).toEqual([
      form3.id,
      form4.id
    ]);
  });

  it.each([
    Status.SEALED,
    Status.SENT,
    Status.RECEIVED,
    Status.ACCEPTED,
    Status.REFUSED,
    Status.PROCESSED
  ])("should filter by readableId (%p)", async status => {
    const { user: owner } = await userWithCompanyFactory("MEMBER");
    const request = supertest(app);

    const allowedIP = faker.internet.ipv4();
    // the gov account running the query
    const { accessToken } = await userWithAccessTokenFactory({
      governmentAccount: {
        create: {
          name: "GERICO",
          permissions: [GovernmentPermission.BSDS_CAN_READ_ALL],
          authorizedOrgIds: ["ALL"],
          authorizedIPs: [allowedIP]
        }
      }
    });
    const siret1 = siretify(1);
    const siret2 = siretify(2);
    const siret3 = siretify(3);
    const siret4 = siretify(3);

    const form1 = await formFactory({
      ownerId: owner.id,
      opt: {
        status,
        sentAt: new Date(),
        transporters: {
          create: {
            transporterCompanySiret: siret1,
            number: 1,
            takenOverAt: new Date(),
            transporterNumberPlate: "AZ 23 99"
          }
        }
      }
    });

    const form2 = await formFactory({
      ownerId: owner.id,
      opt: {
        status,
        sentAt: new Date(),
        transporters: {
          create: {
            transporterCompanySiret: siret2,
            number: 1,
            takenOverAt: new Date(),
            transporterNumberPlate: "AZ 23 99"
          }
        }
      }
    });

    const form3 = await formFactory({
      ownerId: owner.id,
      opt: {
        status,
        sentAt: new Date(),
        transporters: {
          create: {
            transporterCompanySiret: siret3,
            number: 1,
            takenOverAt: new Date(),
            transporterNumberPlate: "QS 23 99"
          }
        }
      }
    });

    const form4 = await formFactory({
      ownerId: owner.id,
      opt: {
        status,
        receivedAt: new Date(),
        wasteAcceptationStatus: WasteAcceptationStatus.REFUSED,
        transporters: {
          create: {
            transporterCompanySiret: siret4,
            number: 1,
            takenOverAt: new Date(),
            transporterNumberPlate: "AZ 23 99"
          }
        }
      }
    });

    await indexForm(await getFormForElastic(form1));
    await indexForm(await getFormForElastic(form2));
    await indexForm(await getFormForElastic(form3));
    await indexForm(await getFormForElastic(form4));

    await refreshElasticSearch();
    const res = await request
      .post("/")
      .send({
        query: `{ controlBsds(where: {readableId: "${form1.readableId}"}) {  
          edges {
            node {
              ... on Form {
                id
          }
        }
      }
        pageInfo: totalCount}}`
      })
      .set("Authorization", `Bearer ${accessToken}`)
      .set("X-Forwarded-For", allowedIP);
    const { errors, data } = res.body;

    expect(errors).toBeUndefined();
    expect(data.controlBsds.pageInfo).toEqual(1);
    // the form matches the
    expect(data.controlBsds.edges.map(e => e.node.id).sort()).toEqual([
      form1.id
    ]);
  });

  it("should exclude DRAFT when filtered by readableId  ", async () => {
    const { user: owner } = await userWithCompanyFactory("MEMBER");
    const request = supertest(app);

    const allowedIP = faker.internet.ipv4();
    // the gov account running the query
    const { accessToken } = await userWithAccessTokenFactory({
      governmentAccount: {
        create: {
          name: "GERICO",
          permissions: [GovernmentPermission.BSDS_CAN_READ_ALL],
          authorizedOrgIds: ["ALL"],
          authorizedIPs: [allowedIP]
        }
      }
    });
    const siret = siretify(1);

    const form = await formFactory({
      ownerId: owner.id,
      opt: {
        status: "DRAFT",
        sentAt: new Date(),
        transporters: {
          create: {
            transporterCompanySiret: siret,
            number: 1,
            takenOverAt: new Date(),
            transporterNumberPlate: "AZ 23 99"
          }
        }
      }
    });

    await indexForm(await getFormForElastic(form));

    await refreshElasticSearch();
    const res = await request
      .post("/")
      .send({
        query: `{ controlBsds(where: {readableId: "${form.readableId}"}) {  
          edges {
            node {
              ... on Form {
                id
          }
        }
      }
        pageInfo: totalCount}}`
      })
      .set("Authorization", `Bearer ${accessToken}`)
      .set("X-Forwarded-For", allowedIP);
    const { errors, data } = res.body;

    expect(errors).toBeUndefined();
    expect(data.controlBsds.pageInfo).toEqual(0);
    // the form matches the
    expect(data.controlBsds.edges).toEqual([]);
  });
});
