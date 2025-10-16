import { UserRole } from "@prisma/client";
import { resetDatabase } from "../../../../../integration-tests/helper";
import type { Query, QueryBsdasArgs } from "@td/codegen-back";
import {
  userWithCompanyFactory,
  companyAssociatedToExistingUserFactory,
  companyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { bsdaFactory } from "../../../__tests__/factories";
import { prisma } from "@td/prisma";

const GET_BSDAS = `
  query GetBsdas($after: ID, $first: Int, $before: ID, $last: Int, $where: BsdaWhere) {
    bsdas(after: $after, first: $first, before: $before, last: $last, where: $where) {
      edges {
        node {
          id
          grouping {
            id
          }
          forwarding {
            id
          }
          transporter {
            company {
              siret
            }
          }
          metadata {
            errors {
              requiredFor
            }
            latestRevision {
              authoringCompany {
                siret
              }
              status
            }
          }
        }
      }
    }
  }
`;

describe("Query.bsdas", () => {
  afterEach(resetDatabase);

  it("should return bsdas associated with the user company", async () => {
    const { company, user } = await userWithCompanyFactory(UserRole.ADMIN);
    await bsdaFactory({
      opt: {
        emitterCompanySiret: company.siret
      }
    });

    const { query } = makeClient(user);
    const { data } = await query<Pick<Query, "bsdas">, QueryBsdasArgs>(
      GET_BSDAS
    );

    expect(data.bsdas.edges.length).toBe(1);
  });

  it("should return bsdas associated with the user company if he is transporter", async () => {
    const { company, user } = await userWithCompanyFactory(UserRole.ADMIN);
    await bsdaFactory({
      opt: { transportersOrgIds: [company.siret!] },
      transporterOpt: { transporterCompanySiret: company.siret }
    });

    const { query } = makeClient(user);
    const { data } = await query<Pick<Query, "bsdas">, QueryBsdasArgs>(
      GET_BSDAS
    );

    expect(data.bsdas.edges.length).toBe(1);
  });

  it("should return bsdas where user company is an intermediary", async () => {
    const otherCompany = await companyFactory();
    const { company, user } = await userWithCompanyFactory(UserRole.ADMIN);
    await bsdaFactory({
      opt: {
        emitterCompanySiret: otherCompany.siret,
        intermediaries: {
          create: [
            { siret: company.siret!, name: company.name, contact: "joe" }
          ]
        }
      }
    });

    const { query } = makeClient(user);
    const { data } = await query<Pick<Query, "bsdas">, QueryBsdasArgs>(
      GET_BSDAS
    );

    expect(data.bsdas.edges.length).toBe(1);
  });

  it("should not return bsdas not associated with the user company", async () => {
    const { company, user } = await userWithCompanyFactory(UserRole.ADMIN);
    await bsdaFactory({
      opt: {
        emitterCompanySiret: company.siret
      }
    });
    await bsdaFactory({});

    const { query } = makeClient(user);
    const { data } = await query<Pick<Query, "bsdas">, QueryBsdasArgs>(
      GET_BSDAS
    );

    expect(data.bsdas.edges.length).toBe(1);
  });

  it("should return bsdas associated for user with several companies", async () => {
    const { company, user } = await userWithCompanyFactory(UserRole.ADMIN);
    const otherCompany = await companyAssociatedToExistingUserFactory(
      user,
      UserRole.ADMIN
    );
    await bsdaFactory({
      opt: {
        emitterCompanySiret: company.siret
      }
    });
    await bsdaFactory({
      opt: {
        emitterCompanySiret: otherCompany.siret
      }
    });

    const { query } = makeClient(user);
    const { data } = await query<Pick<Query, "bsdas">, QueryBsdasArgs>(
      GET_BSDAS
    );

    expect(data.bsdas.edges.length).toBe(2);
  });

  it("should list all of user's bsdas", async () => {
    const { company, user } = await userWithCompanyFactory(UserRole.ADMIN);

    const fields = Object.values(contributorsFields);
    for (const field of fields) {
      await bsdaFactory({
        opt: {
          [field]: company.siret
        }
      });
    }

    const { query } = makeClient(user);
    const { data } = await query<Pick<Query, "bsdas">, QueryBsdasArgs>(
      GET_BSDAS
    );

    expect(data.bsdas.edges.length).toBe(fields.length);
  });

  const contributorsFields = {
    emitter: "emitterCompanySiret",
    destination: "destinationCompanySiret",
    worker: "workerCompanySiret",
    broker: "brokerCompanySiret"
  };

  it.each(Object.keys(contributorsFields))(
    "should filter bsdas where user appears as %s",
    async role => {
      const { company, user } = await userWithCompanyFactory(UserRole.ADMIN);

      for (const field of Object.values(contributorsFields)) {
        await bsdaFactory({
          opt: {
            [field]: company.siret
          }
        });
      }

      const { query } = makeClient(user);
      const { data } = await query<Pick<Query, "bsdas">, QueryBsdasArgs>(
        GET_BSDAS,
        {
          variables: {
            where: {
              [role]: {
                company: {
                  siret: { _eq: company.siret }
                }
              }
            }
          }
        }
      );

      expect(data.bsdas.edges.length).toBe(1);
    }
  );

  it("should filter bsdas where user appears as transporter", async () => {
    const { company, user } = await userWithCompanyFactory(UserRole.ADMIN);

    await bsdaFactory({
      opt: { transportersOrgIds: [company.siret!] },
      transporterOpt: {
        transporterCompanySiret: company.siret
      }
    });

    const { query } = makeClient(user);
    const { data } = await query<Pick<Query, "bsdas">, QueryBsdasArgs>(
      GET_BSDAS,
      {
        variables: {
          where: {
            transporter: {
              company: {
                siret: { _eq: company.siret }
              }
            }
          }
        }
      }
    );

    expect(data.bsdas.edges.length).toBe(1);
  });

  it("should not return deleted bsdas", async () => {
    const { company, user } = await userWithCompanyFactory(UserRole.ADMIN);
    await bsdaFactory({
      opt: {
        isDeleted: true,
        emitterCompanySiret: company.siret
      }
    });

    const { query } = makeClient(user);
    const { data } = await query<Pick<Query, "bsdas">, QueryBsdasArgs>(
      GET_BSDAS
    );

    expect(data.bsdas.edges.length).toBe(0);
  });

  it("should list the associated bsdas", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);

    const groupedBsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: emitter.company.siret,
        status: "AWAITING_CHILD"
      }
    });
    const forwardedBsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: emitter.company.siret,
        status: "AWAITING_CHILD"
      }
    });
    await bsdaFactory({
      opt: {
        emitterCompanySiret: emitter.company.siret,
        grouping: { connect: [{ id: groupedBsda.id }] },
        forwarding: { connect: { id: forwardedBsda.id } }
      }
    });

    const { query } = makeClient(emitter.user);
    const { data } = await query<Pick<Query, "bsdas">, QueryBsdasArgs>(
      GET_BSDAS
    );

    expect(data.bsdas.edges[0].node.grouping).toEqual([
      expect.objectContaining({
        id: groupedBsda.id
      })
    ]);
    expect(data.bsdas.edges[0].node.forwarding).toEqual(
      expect.objectContaining({
        id: forwardedBsda.id
      })
    );
  });

  it("should enable excluding bsdas that are already grouped or forwarded", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);

    const groupedBsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: emitter.company.siret,
        status: "AWAITING_CHILD"
      }
    });
    const forwardedBsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: emitter.company.siret,
        status: "AWAITING_CHILD"
      }
    });
    await bsdaFactory({
      opt: {
        emitterCompanySiret: emitter.company.siret,
        grouping: { connect: [{ id: groupedBsda.id }] },
        forwarding: { connect: { id: forwardedBsda.id } }
      }
    });

    const { query } = makeClient(emitter.user);
    const { data: dataWithoutNullFilter } = await query<
      Pick<Query, "bsdas">,
      QueryBsdasArgs
    >(GET_BSDAS, {
      variables: {
        where: {
          status: { _eq: "AWAITING_CHILD" }
        }
      }
    });
    expect(dataWithoutNullFilter.bsdas.edges.length).toBe(2);

    const { data } = await query<Pick<Query, "bsdas">, QueryBsdasArgs>(
      GET_BSDAS,
      {
        variables: {
          where: {
            groupedIn: { _eq: null },
            forwardedIn: { _eq: null },
            status: { _eq: "AWAITING_CHILD" }
          }
        }
      }
    );

    expect(data.bsdas.edges.length).toBe(0);
  });

  it("should return latest revision as metadata", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);
    const worker = await userWithCompanyFactory(UserRole.ADMIN);
    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: emitter.company.siret,
        destinationCompanySiret: destination.company.siret,
        workerCompanySiret: worker.company.siret
      }
    });

    // Accepted revision
    await prisma.bsdaRevisionRequest.create({
      data: {
        comment: "a comment",
        bsdaId: bsda.id,
        authoringCompanyId: emitter.company.id,
        wasteCode: "06 07 02*",
        status: "ACCEPTED"
      }
    });
    // Pending revision
    await prisma.bsdaRevisionRequest.create({
      data: {
        comment: "a comment",
        bsdaId: bsda.id,
        authoringCompanyId: emitter.company.id,
        wasteCode: "06 07 02*",
        status: "PENDING",
        approvals: {
          createMany: {
            data: [
              {
                status: "PENDING",
                approverSiret: destination.company.siret!
              },
              { status: "ACCEPTED", approverSiret: worker.company.siret! }
            ]
          }
        }
      }
    });

    const { query } = makeClient(emitter.user);
    const { data } = await query<Pick<Query, "bsdas">, QueryBsdasArgs>(
      GET_BSDAS
    );

    expect(data.bsdas.edges.length).toBe(1);
    expect(data.bsdas.edges[0].node.metadata.latestRevision).toBeDefined();
    expect(
      data.bsdas.edges[0].node.metadata.latestRevision?.authoringCompany?.siret
    ).toBe(emitter.company.siret);
  });

  it("should return transporter of bsdas associated with the user company", async () => {
    const { company, user } = await userWithCompanyFactory(UserRole.ADMIN);
    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: company.siret
      }
    });

    const { query } = makeClient(user);
    const { data } = await query<Pick<Query, "bsdas">, QueryBsdasArgs>(
      GET_BSDAS
    );

    expect(data.bsdas.edges.length).toBe(1);
    expect(data.bsdas.edges[0].node.transporter?.company?.siret).toBe(
      bsda.transporters[0].transporterCompanySiret
    );
  });

  it("should return bsdas associated with the user company even if operation mode is illegal", async () => {
    // Given
    const { company, user } = await userWithCompanyFactory(UserRole.ADMIN);
    await bsdaFactory({
      opt: {
        emitterCompanySiret: company.siret,
        destinationOperationCode: "R 5",
        destinationOperationMode: "REUTILISATION",
        destinationOperationSignatureDate: new Date()
      }
    });

    // When
    const { query } = makeClient(user);
    const { data, errors } = await query<Pick<Query, "bsdas">, QueryBsdasArgs>(
      GET_BSDAS
    );

    // Then
    expect(errors).toBeUndefined();
    expect(data.bsdas.edges.length).toBe(1);
  });
});
