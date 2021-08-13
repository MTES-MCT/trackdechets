import { UserRole, BsffStatus, BsffType } from "@prisma/client";
import { resetDatabase } from "../../../../../integration-tests/helper";
import {
  Mutation,
  MutationCreateBsffArgs
} from "../../../../generated/graphql/types";
import prisma from "../../../../prisma";
import {
  UserWithCompany,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { OPERATION } from "../../../constants";
import {
  createBsffAfterEmission,
  createBsffAfterOperation
} from "../../../__tests__/factories";

const CREATE_BSFF = `
  mutation CreateBsff($input: BsffInput!) {
    createBsff(input: $input) {
      id
    }
  }
`;

describe("Mutation.createBsff", () => {
  afterEach(resetDatabase);

  it("should allow user to create a bsff", async () => {
    const { user, company } = await userWithCompanyFactory(UserRole.ADMIN);
    const { mutate } = makeClient(user);
    const { data } = await mutate<
      Pick<Mutation, "createBsff">,
      MutationCreateBsffArgs
    >(CREATE_BSFF, {
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

    expect(data.createBsff.id).toBeTruthy();
  });

  it("should disallow unauthenticated user from creating a bsff", async () => {
    const { mutate } = makeClient();
    const { errors } = await mutate<
      Pick<Mutation, "createBsff">,
      MutationCreateBsffArgs
    >(CREATE_BSFF, {
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
      Pick<Mutation, "createBsff">,
      MutationCreateBsffArgs
    >(CREATE_BSFF, {
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
        Pick<Mutation, "createBsff">,
        MutationCreateBsffArgs
      >(CREATE_BSFF, {
        variables: {
          input: {
            type: BsffType.GROUPEMENT,
            destination: {
              company: {
                name: destination.company.name,
                siret: destination.company.siret,
                address: destination.company.address,
                contact: destination.user.name,
                mail: destination.user.email
              }
            },
            previousBsffs: [previousBsff.id]
          }
        }
      });

      expect(errors).toBeUndefined();

      const previousBsffs = await prisma.bsff
        .findUnique({ where: { id: data.createBsff.id } })
        .previousBsffs();
      expect(previousBsffs).toHaveLength(1);
    });

    it("should add bsffs for réexpédition", async () => {
      const previousBsff = await createBsffAfterOperation(
        { emitter, transporter, destination },
        {
          status: BsffStatus.INTERMEDIATELY_PROCESSED,
          destinationOperationCode: null
        }
      );

      const { mutate } = makeClient(destination.user);
      const { data, errors } = await mutate<
        Pick<Mutation, "createBsff">,
        MutationCreateBsffArgs
      >(CREATE_BSFF, {
        variables: {
          input: {
            type: BsffType.REEXPEDITION,
            destination: {
              company: {
                name: destination.company.name,
                siret: destination.company.siret,
                address: destination.company.address,
                contact: destination.user.name,
                mail: destination.user.email
              }
            },
            previousBsffs: [previousBsff.id]
          }
        }
      });

      expect(errors).toBeUndefined();

      const previousBsffs = await prisma.bsff
        .findUnique({ where: { id: data.createBsff.id } })
        .previousBsffs();
      expect(previousBsffs).toHaveLength(1);
    });

    it("should disallow adding bsffs with missing signatures", async () => {
      const previousBsffs = await Promise.all([
        createBsffAfterEmission({ emitter, transporter, destination })
      ]);

      const { mutate } = makeClient(destination.user);
      const { errors } = await mutate<
        Pick<Mutation, "createBsff">,
        MutationCreateBsffArgs
      >(CREATE_BSFF, {
        variables: {
          input: {
            type: BsffType.GROUPEMENT,
            destination: {
              company: {
                name: destination.company.name,
                siret: destination.company.siret,
                address: destination.company.address,
                contact: destination.user.name,
                mail: destination.user.email
              }
            },
            previousBsffs: previousBsffs.map(previousBsff => previousBsff.id)
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
  });
});
