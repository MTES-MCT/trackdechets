import { Bsff, BsffFicheIntervention, UserRole } from ".prisma/client";
import { resetDatabase } from "../../../../../integration-tests/helper";
import getReadableId, { ReadableIdPrefix } from "../../../../forms/readableId";
import { Query, QueryBsffsArgs } from "../../../../generated/graphql/types";
import prisma from "../../../../prisma";
import {
  userWithCompanyFactory,
  companyAssociatedToExistingUserFactory,
  UserWithCompany
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { OPERATION_CODES } from "../../../constants";
import {
  createBsff,
  createBsffAfterOperation
} from "../../../__tests__/factories";

const GET_BSFFS = `
  query GetBsffs($after: ID, $first: Int, $before: ID, $last: Int, $where: BsffWhere) {
    bsffs(after: $after, first: $first, before: $before, last: $last, where: $where) {
      edges {
        node {
          id
          ficheInterventions {
            numero
          }
          children {
            id
            ficheInterventions {
              detenteur {
                company {
                  siret
                }
              }
            }
          }
        }
      }
    }
  }
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
                  siret: userAndCompany.company.siret
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
              kilos: 2,
              detenteurCompanyName: "Acme",
              detenteurCompanySiret: "1".repeat(14),
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
          {
            numero: ficheInterventionNumero
          }
        ]
      })
    );
  });

  it("should filter bsffs with a given operation code", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    await createBsff(
      { emitter },
      {
        destinationOperationCode: OPERATION_CODES.D10
      }
    );
    await createBsff(
      { emitter },
      {
        destinationOperationCode: OPERATION_CODES.R12
      }
    );

    const { query } = makeClient(emitter.user);
    const { data } = await query<Pick<Query, "bsffs">, QueryBsffsArgs>(
      GET_BSFFS,
      {
        variables: {
          where: {
            destination: {
              operation: {
                code: "D10"
              }
            }
          }
        }
      }
    );

    expect(data.bsffs.edges.length).toBe(1);
  });

  describe("when listing the grouped bsffs", () => {
    let emitter: UserWithCompany;
    let transporter: UserWithCompany;
    let destination: UserWithCompany;
    let groupedBsff: Bsff;
    let groupedBsffFicheIntervention: BsffFicheIntervention;

    beforeEach(async () => {
      emitter = await userWithCompanyFactory(UserRole.ADMIN);
      transporter = await userWithCompanyFactory(UserRole.ADMIN);
      destination = await userWithCompanyFactory(UserRole.ADMIN);

      const bsffId = getReadableId(ReadableIdPrefix.FF);
      const ficheInterventionNumero = "00001";
      groupedBsff = await createBsffAfterOperation(
        {
          emitter,
          transporter,
          destination
        },
        {
          id: bsffId,
          destinationOperationCode: OPERATION_CODES.R12,
          ficheInterventions: {
            create: [
              {
                numero: ficheInterventionNumero,
                kilos: 2,
                postalCode: "69000",
                detenteurCompanyName: "Acme",
                detenteurCompanySiret: "1".repeat(14),
                detenteurCompanyAddress: "12 rue Albert Lyon 69000",
                detenteurCompanyContact: "Carla Brownie",
                detenteurCompanyMail: "carla.brownie@gmail.com",
                detenteurCompanyPhone: "06",
                operateurCompanyName: "Clim'op",
                operateurCompanySiret: "2".repeat(14),
                operateurCompanyAddress: "12 rue Albert Lyon 69000",
                operateurCompanyContact: "Dupont Jean",
                operateurCompanyMail: "contact@climop.com",
                operateurCompanyPhone: "06"
              }
            ]
          }
        }
      );
      groupedBsffFicheIntervention = await prisma.bsffFicheIntervention.findFirst(
        { where: { bsffId: groupedBsff.id } }
      );
    });

    it("should list the grouped bsffs", async () => {
      await createBsff(
        { emitter, transporter, destination },
        { children: { connect: [{ id: groupedBsff.id }] } }
      );

      const { query } = makeClient(emitter.user);
      const { data } = await query<Pick<Query, "bsffs">, QueryBsffsArgs>(
        GET_BSFFS
      );

      expect(data.bsffs.edges[0].node.children).toEqual([
        expect.objectContaining({
          id: groupedBsff.id
        })
      ]);
    });

    it("should show the detenteur from the fiche d'interventions to companies on the bsff", async () => {
      await createBsff(
        { emitter, transporter, destination },
        { children: { connect: [{ id: groupedBsff.id }] } }
      );

      const { query } = makeClient(destination.user);
      const { data } = await query<Pick<Query, "bsffs">, QueryBsffsArgs>(
        GET_BSFFS
      );

      expect(data.bsffs.edges[0].node.children).toEqual([
        expect.objectContaining({
          ficheInterventions: [
            {
              detenteur: {
                company: {
                  siret: groupedBsffFicheIntervention.detenteurCompanySiret
                }
              }
            }
          ]
        })
      ]);
    });

    it("should not show the detenteur from the fiche d'interventions to companies not on the bsff", async () => {
      const newDestination = await userWithCompanyFactory(UserRole.ADMIN);

      await createBsff(
        { emitter: destination, transporter, destination: newDestination },
        { children: { connect: [{ id: groupedBsff.id }] } }
      );

      const { query } = makeClient(newDestination.user);
      const { data } = await query<Pick<Query, "bsffs">, QueryBsffsArgs>(
        GET_BSFFS
      );

      expect(data.bsffs.edges[0].node.children).toEqual([
        expect.objectContaining({
          ficheInterventions: [
            {
              detenteur: null
            }
          ]
        })
      ]);
    });
  });
});
