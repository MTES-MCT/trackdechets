import { UserRole, BsffStatus, BsffType } from "@prisma/client";
import { resetDatabase } from "../../../../../integration-tests/helper";
import {
  Mutation,
  MutationCreateDraftBsffArgs
} from "../../../../generated/graphql/types";
import prisma from "../../../../prisma";
import {
  UserWithCompany,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { OPERATION } from "../../../constants";
import {
  createBsff,
  createBsffAfterEmission,
  createBsffAfterOperation
} from "../../../__tests__/factories";

const CREATE_DRAFT_BSFF = `
  mutation CreateDraftBsff($input: BsffInput!) {
    createDraftBsff(input: $input) {
      id
    }
  }
`;

describe("Mutation.createDraftBsff", () => {
  afterEach(resetDatabase);

  it("should allow user to create a bsff", async () => {
    const { user, company } = await userWithCompanyFactory(UserRole.ADMIN);
    const { mutate } = makeClient(user);
    const { data, errors } = await mutate<
      Pick<Mutation, "createDraftBsff">,
      MutationCreateDraftBsffArgs
    >(CREATE_DRAFT_BSFF, {
      variables: {
        input: {
          emitter: {
            company: {
              name: company.name,
              siret: company.siret,
              address: company.address,
              contact: user.name,
              mail: user.email
            }
          }
        }
      }
    });

    expect(errors).toBeUndefined();
    expect(data.createDraftBsff.id).toBeTruthy();
  });

  it("should disallow unauthenticated user from creating a bsff", async () => {
    const { mutate } = makeClient();
    const { errors } = await mutate<
      Pick<Mutation, "createDraftBsff">,
      MutationCreateDraftBsffArgs
    >(CREATE_DRAFT_BSFF, {
      variables: {
        input: {}
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        extensions: {
          code: "UNAUTHENTICATED"
        }
      })
    ]);
  });

  it("should disallow user that is not a contributor on the bsff", async () => {
    const { user } = await userWithCompanyFactory(UserRole.ADMIN);
    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "createDraftBsff">,
      MutationCreateDraftBsffArgs
    >(CREATE_DRAFT_BSFF, {
      variables: {
        input: {
          emitter: {
            company: {
              name: "Clim' Clean",
              siret: "1".repeat(14),
              address: "12 rue de Laval 69000",
              contact: "Marco Polo",
              mail: "marco.polo@gmail.com"
            }
          }
        }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Vous ne pouvez pas éditer un bordereau sur lequel le SIRET de votre entreprise n'apparaît pas."
      })
    ]);
  });

  describe("when adding previous bsffs", () => {
    let emitter: UserWithCompany;
    let transporter: UserWithCompany;
    let destination: UserWithCompany;

    beforeEach(async () => {
      emitter = await userWithCompanyFactory(UserRole.ADMIN);
      transporter = await userWithCompanyFactory(UserRole.ADMIN);
      destination = await userWithCompanyFactory(UserRole.ADMIN);
    });

    it("should add bsffs for groupement", async () => {
      const previousBsff = await createBsffAfterOperation(
        { emitter, transporter, destination },
        {
          status: BsffStatus.INTERMEDIATELY_PROCESSED,
          destinationOperationCode: OPERATION.R12.code
        }
      );

      const { mutate } = makeClient(destination.user);
      const { data, errors } = await mutate<
        Pick<Mutation, "createDraftBsff">,
        MutationCreateDraftBsffArgs
      >(CREATE_DRAFT_BSFF, {
        variables: {
          input: {
            type: BsffType.GROUPEMENT,
            emitter: {
              company: {
                name: destination.company.name,
                siret: destination.company.siret,
                address: destination.company.address,
                contact: destination.user.name,
                mail: destination.user.email
              }
            },
            grouping: [previousBsff.id]
          }
        }
      });

      expect(errors).toBeUndefined();

      const groupement = await prisma.bsff
        .findUnique({ where: { id: data.createDraftBsff.id } })
        .grouping();
      expect(groupement).toHaveLength(1);
    });

    it("should add a bsff for réexpedition", async () => {
      const forwarded = await createBsffAfterOperation(
        { emitter, transporter, destination },
        {
          status: BsffStatus.INTERMEDIATELY_PROCESSED,
          destinationOperationCode: OPERATION.R13.code
        }
      );
      const { mutate } = makeClient(destination.user);
      const { data, errors } = await mutate<
        Pick<Mutation, "createDraftBsff">,
        MutationCreateDraftBsffArgs
      >(CREATE_DRAFT_BSFF, {
        variables: {
          input: {
            type: BsffType.REEXPEDITION,
            emitter: {
              company: {
                name: destination.company.name,
                siret: destination.company.siret,
                address: destination.company.address,
                contact: destination.user.name,
                mail: destination.user.email
              }
            },
            forwarding: forwarded.id
          }
        }
      });

      expect(errors).toBeUndefined();

      const actualforwarding = await prisma.bsff
        .findUnique({ where: { id: data.createDraftBsff.id } })
        .forwarding();
      expect(actualforwarding.id).toEqual(forwarded.id);
    });

    it("should add bsffs for repackaging", async () => {
      const previousBsffs = await Promise.all([
        createBsffAfterOperation(
          { emitter, transporter, destination },
          {
            status: BsffStatus.INTERMEDIATELY_PROCESSED,
            destinationOperationCode: OPERATION.D14.code
          }
        )
      ]);

      const { mutate } = makeClient(destination.user);
      const { data, errors } = await mutate<
        Pick<Mutation, "createDraftBsff">,
        MutationCreateDraftBsffArgs
      >(CREATE_DRAFT_BSFF, {
        variables: {
          input: {
            type: BsffType.RECONDITIONNEMENT,
            emitter: {
              company: {
                name: destination.company.name,
                siret: destination.company.siret,
                address: destination.company.address,
                contact: destination.user.name,
                mail: destination.user.email
              }
            },
            repackaging: previousBsffs.map(previousBsff => previousBsff.id)
          }
        }
      });

      expect(errors).toBeUndefined();

      const actualRepackaging = await prisma.bsff
        .findUnique({ where: { id: data.createDraftBsff.id } })
        .repackaging();
      expect(actualRepackaging).toHaveLength(previousBsffs.length);
    });

    it("should disallow adding bsffs with missing signatures", async () => {
      const previousBsffs = await Promise.all([
        createBsffAfterEmission({ emitter, transporter, destination })
      ]);

      const { mutate } = makeClient(destination.user);
      const { errors } = await mutate<
        Pick<Mutation, "createDraftBsff">,
        MutationCreateDraftBsffArgs
      >(CREATE_DRAFT_BSFF, {
        variables: {
          input: {
            type: BsffType.GROUPEMENT,
            emitter: {
              company: {
                name: destination.company.name,
                siret: destination.company.siret,
                address: destination.company.address,
                contact: destination.user.name,
                mail: destination.user.email
              }
            },
            grouping: previousBsffs.map(previousBsff => previousBsff.id)
          }
        }
      });

      expect(errors).toEqual([
        expect.objectContaining({
          message: previousBsffs
            .map(
              previousBsff =>
                `Le bordereau n°${previousBsff.id} n'a pas toutes les signatures requises.`
            )
            .join("\n")
        })
      ]);
    });

    it("should throw an error when emitter is not previous bsffs' destination", async () => {
      const otherDestination = await userWithCompanyFactory(UserRole.ADMIN);
      const previousBsff = await createBsffAfterOperation(
        { emitter, transporter, destination: otherDestination },
        {
          status: BsffStatus.INTERMEDIATELY_PROCESSED,
          destinationOperationCode: OPERATION.R12.code
        }
      );

      const { mutate } = makeClient(destination.user);
      const { errors } = await mutate<
        Pick<Mutation, "createDraftBsff">,
        MutationCreateDraftBsffArgs
      >(CREATE_DRAFT_BSFF, {
        variables: {
          input: {
            type: BsffType.GROUPEMENT,
            emitter: {
              company: {
                name: destination.company.name,
                siret: destination.company.siret,
                address: destination.company.address,
                contact: destination.user.name,
                mail: destination.user.email
              }
            },
            grouping: [previousBsff.id]
          }
        }
      });

      expect(errors).toEqual([
        expect.objectContaining({
          message:
            "Certains des bordereaux à associer ne sont pas en la possession du nouvel émetteur."
        })
      ]);
    });

    it("should throw an error if previous bsffs don't have the same destination", async () => {
      const otherDestination = await userWithCompanyFactory(UserRole.ADMIN);
      const previousBsffs = await Promise.all([
        createBsffAfterOperation(
          { emitter, transporter, destination },
          {
            status: BsffStatus.INTERMEDIATELY_PROCESSED,
            destinationOperationCode: OPERATION.R12.code
          }
        ),
        createBsffAfterOperation(
          { emitter, transporter, destination: otherDestination },
          {
            status: BsffStatus.INTERMEDIATELY_PROCESSED,
            destinationOperationCode: OPERATION.R12.code
          }
        )
      ]);

      const { mutate } = makeClient(transporter.user);
      const { errors } = await mutate<
        Pick<Mutation, "createDraftBsff">,
        MutationCreateDraftBsffArgs
      >(CREATE_DRAFT_BSFF, {
        variables: {
          input: {
            type: BsffType.GROUPEMENT,
            transporter: {
              company: {
                name: transporter.company.name,
                siret: transporter.company.siret,
                address: transporter.company.address,
                contact: transporter.user.name,
                mail: transporter.user.email
              }
            },
            grouping: previousBsffs.map(previousBsff => previousBsff.id)
          }
        }
      });

      expect(errors).toEqual([
        expect.objectContaining({
          message:
            "Certains des bordereaux à associer ne sont pas en possession du même établissement."
        })
      ]);
    });

    it("should allow creating a bsff with previous bsffs but no emitter", async () => {
      const previousBsffs = await Promise.all([
        createBsffAfterOperation(
          { emitter, transporter, destination },
          {
            status: BsffStatus.INTERMEDIATELY_PROCESSED,
            destinationOperationCode: OPERATION.R12.code
          }
        ),
        createBsffAfterOperation(
          { emitter, transporter, destination },
          {
            status: BsffStatus.INTERMEDIATELY_PROCESSED,
            destinationOperationCode: OPERATION.R12.code
          }
        )
      ]);

      const { mutate } = makeClient(transporter.user);
      const { data, errors } = await mutate<
        Pick<Mutation, "createDraftBsff">,
        MutationCreateDraftBsffArgs
      >(CREATE_DRAFT_BSFF, {
        variables: {
          input: {
            type: BsffType.GROUPEMENT,
            transporter: {
              company: {
                name: transporter.company.name,
                siret: transporter.company.siret,
                address: transporter.company.address,
                contact: transporter.user.name,
                mail: transporter.user.email
              }
            },
            grouping: previousBsffs.map(previousBsff => previousBsff.id)
          }
        }
      });

      expect(errors).toBeUndefined();

      const actualGroupement = await prisma.bsff
        .findUnique({ where: { id: data.createDraftBsff.id } })
        .grouping();
      expect(actualGroupement).toHaveLength(previousBsffs.length);
    });

    it("should throw an error if initial BSFF has already been forwarded, grouped or repackaged", async () => {
      const anotherGroupingBsff = await createBsff({});
      const previousBsffs = await Promise.all([
        createBsffAfterOperation(
          { emitter, transporter, destination },
          {
            status: BsffStatus.INTERMEDIATELY_PROCESSED,
            destinationOperationCode: OPERATION.R12.code,
            groupedIn: { connect: { id: anotherGroupingBsff.id } }
          }
        ),
        createBsffAfterOperation(
          { emitter, transporter, destination },
          {
            status: BsffStatus.INTERMEDIATELY_PROCESSED,
            destinationOperationCode: OPERATION.R12.code
          }
        )
      ]);
      const { mutate } = makeClient(transporter.user);
      const { errors } = await mutate<
        Pick<Mutation, "createDraftBsff">,
        MutationCreateDraftBsffArgs
      >(CREATE_DRAFT_BSFF, {
        variables: {
          input: {
            type: BsffType.GROUPEMENT,
            transporter: {
              company: {
                name: transporter.company.name,
                siret: transporter.company.siret,
                address: transporter.company.address,
                contact: transporter.user.name,
                mail: transporter.user.email
              }
            },
            grouping: previousBsffs.map(previousBsff => previousBsff.id)
          }
        }
      });

      expect(errors).toEqual([
        expect.objectContaining({
          message: `Le bordereau n°${previousBsffs[0].id} a déjà été réexpédié, reconditionné ou groupé.`
        })
      ]);
    });
  });
});
