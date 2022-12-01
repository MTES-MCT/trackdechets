import { BsffPackagingType, UserRole } from "@prisma/client";
import { gql } from "apollo-server-express";
import { resetDatabase } from "../../../../../integration-tests/helper";
import getReadableId, { ReadableIdPrefix } from "../../../../forms/readableId";
import { Query, QueryBsffsArgs } from "../../../../generated/graphql/types";
import {
  userWithCompanyFactory,
  companyAssociatedToExistingUserFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { fullBsff } from "../../../fragments";
import { createBsff } from "../../../__tests__/factories";

const GET_BSFFS = gql`
  query GetBsffs(
    $after: ID
    $first: Int
    $before: ID
    $last: Int
    $where: BsffWhere
  ) {
    bsffs(
      after: $after
      first: $first
      before: $before
      last: $last
      where: $where
    ) {
      edges {
        node {
          ...FullBsff
        }
      }
    }
  }
  ${fullBsff}
`;

describe("Query.bsffs", () => {
  afterEach(resetDatabase);

  it("should return bsffs for the user's company", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    await createBsff({ emitter });

    const { query } = makeClient(emitter.user);
    const { data } = await query<Pick<Query, "bsffs">, QueryBsffsArgs>(
      GET_BSFFS
    );

    expect(data.bsffs.edges.length).toBe(1);
  });

  it("should filter out bsffs where the user's company doesn't appear", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    await createBsff({ emitter });

    const otherEmitter = await userWithCompanyFactory(UserRole.ADMIN);
    await createBsff({ emitter: otherEmitter });

    const { query } = makeClient(emitter.user);
    const { data } = await query<Pick<Query, "bsffs">, QueryBsffsArgs>(
      GET_BSFFS
    );

    expect(data.bsffs.edges.length).toBe(1);
  });

  it("should return bsffs for the user with several companies", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const otherCompany = await companyAssociatedToExistingUserFactory(
      emitter.user,
      UserRole.ADMIN
    );

    await createBsff({ emitter });
    await createBsff({
      emitter: { user: emitter.user, company: otherCompany }
    });

    const { query } = makeClient(emitter.user);
    const { data } = await query<Pick<Query, "bsffs">, QueryBsffsArgs>(
      GET_BSFFS
    );

    expect(data.bsffs.edges.length).toBe(2);
  });

  it.each(["emitter", "transporter", "destination"])(
    "should filter bsffs where user appears as %s",
    async role => {
      const userAndCompany = await userWithCompanyFactory(UserRole.ADMIN);

      await createBsff({ emitter: userAndCompany });
      await createBsff({ transporter: userAndCompany });
      await createBsff({ destination: userAndCompany });

      const { query } = makeClient(userAndCompany.user);
      const { data } = await query<Pick<Query, "bsffs">, QueryBsffsArgs>(
        GET_BSFFS,
        {
          variables: {
            where: {
              [role]: {
                company: {
                  siret: { _eq: userAndCompany.company.siret }
                }
              }
            }
          }
        }
      );

      expect(data.bsffs.edges.length).toBe(1);
    }
  );

  it("should not return deleted bsffs", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    await createBsff({ emitter }, { isDeleted: true });

    const { query } = makeClient(emitter.user);
    const { data } = await query<Pick<Query, "bsffs">, QueryBsffsArgs>(
      GET_BSFFS
    );

    expect(data.bsffs.edges.length).toBe(0);
  });

  it("should list the fiche d'interventions", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);

    const bsffId = getReadableId(ReadableIdPrefix.FF);
    const ficheInterventionNumero = "0000001";
    await createBsff(
      {
        emitter
      },
      {
        id: bsffId,
        ficheInterventions: {
          create: [
            {
              numero: ficheInterventionNumero,
              weight: 2,
              detenteurCompanyName: "Acme",
              detenteurCompanySiret: "3".repeat(14),
              detenteurCompanyAddress: "12 rue de la Tige, 69000",
              detenteurCompanyMail: "contact@gmail.com",
              detenteurCompanyPhone: "06",
              detenteurCompanyContact: "Jeanne Michelin",
              operateurCompanyName: "Clim'op",
              operateurCompanySiret: "2".repeat(14),
              operateurCompanyAddress: "12 rue de la Tige, 69000",
              operateurCompanyMail: "contact@climop.com",
              operateurCompanyPhone: "06",
              operateurCompanyContact: "Jean Dupont",
              postalCode: "69000"
            }
          ]
        }
      }
    );

    const { query } = makeClient(emitter.user);
    const { data } = await query<Pick<Query, "bsffs">, QueryBsffsArgs>(
      GET_BSFFS
    );

    expect(data.bsffs.edges[0].node).toEqual(
      expect.objectContaining({
        ficheInterventions: [
          expect.objectContaining({
            numero: ficheInterventionNumero
          })
        ]
      })
    );
  });

  it("should filter on packagings numero", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const bsff1 = await createBsff(
      { emitter },
      {
        packagings: {
          create: {
            type: BsffPackagingType.BOUTEILLE,
            numero: "AAAAA",
            weight: 1
          }
        }
      }
    );
    const bsff2 = await createBsff(
      { emitter },
      {
        packagings: {
          create: {
            type: BsffPackagingType.BOUTEILLE,
            numero: "BBBBB",
            weight: 1
          }
        }
      }
    );
    const bsff3 = await createBsff(
      { emitter },
      {
        packagings: {
          create: {
            type: BsffPackagingType.BOUTEILLE,
            numero: "CCCCC",
            weight: 1
          }
        }
      }
    );

    const { query } = makeClient(emitter.user);
    const { data: data1 } = await query<Pick<Query, "bsffs">, QueryBsffsArgs>(
      GET_BSFFS,
      {
        variables: {
          where: {
            packagings: {
              numero: {
                _eq: "AAAAA"
              }
            }
          }
        }
      }
    );
    expect(data1.bsffs.edges).toEqual([
      expect.objectContaining({
        node: expect.objectContaining({ id: bsff1.id })
      })
    ]);

    const { data: data2 } = await query<Pick<Query, "bsffs">, QueryBsffsArgs>(
      GET_BSFFS,
      {
        variables: {
          where: {
            packagings: {
              numero: {
                _contains: "AA"
              }
            }
          }
        }
      }
    );
    expect(data2.bsffs.edges).toEqual([
      expect.objectContaining({
        node: expect.objectContaining({ id: bsff1.id })
      })
    ]);

    const { data: data3 } = await query<Pick<Query, "bsffs">, QueryBsffsArgs>(
      GET_BSFFS,
      {
        variables: {
          where: {
            packagings: {
              numero: {
                _in: ["BBBBB", "CCCCC"]
              }
            }
          }
        }
      }
    );
    expect(data3.bsffs.edges).toEqual([
      expect.objectContaining({
        node: expect.objectContaining({ id: bsff3.id })
      }),
      expect.objectContaining({
        node: expect.objectContaining({ id: bsff2.id })
      })
    ]);
  });

  it("should work with a nested _or filter", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const bsff1 = await createBsff(
      { emitter },
      {
        destinationCompanySiret: "00000000000000"
      }
    );
    const bsff2 = await createBsff(
      { emitter },
      {
        destinationCompanySiret: "11111111111111"
      }
    );
    await createBsff(
      { emitter },
      {
        destinationCompanySiret: "22222222222222"
      }
    );

    const { query } = makeClient(emitter.user);
    const { data } = await query<Pick<Query, "bsffs">, QueryBsffsArgs>(
      GET_BSFFS,
      {
        variables: {
          where: {
            _or: [
              {
                destination: { company: { siret: { _eq: "00000000000000" } } }
              },
              {
                destination: { company: { siret: { _eq: "11111111111111" } } }
              }
            ]
          }
        }
      }
    );
    const bsffIds = data.bsffs.edges.map(({ node }) => node.id);
    expect(bsffIds).toEqual([bsff2.id, bsff1.id]);
  });
});
