import { UserRole } from "@prisma/client";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { Query, QueryBsdasArgs } from "../../../../generated/graphql/types";
import {
  userWithCompanyFactory,
  companyAssociatedToExistingUserFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { bsdaFactory } from "../../../__tests__/factories";

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

  it.each(["emitter", "worker", "transporter", "destination"])(
    "should filter bsdas where user appears as %s",
    async role => {
      const { company, user } = await userWithCompanyFactory(UserRole.ADMIN);

      await bsdaFactory({
        opt: {
          emitterCompanySiret: company.siret
        }
      });
      await bsdaFactory({
        opt: {
          workerCompanySiret: company.siret
        }
      });
      await bsdaFactory({
        opt: {
          transporterCompanySiret: company.siret
        }
      });
      await bsdaFactory({
        opt: {
          destinationCompanySiret: company.siret
        }
      });

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
});
