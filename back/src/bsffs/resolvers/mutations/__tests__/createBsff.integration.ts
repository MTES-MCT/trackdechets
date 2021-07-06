import { UserRole } from ".prisma/client";
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
import { OPERATION_CODES } from "../../../constants";
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

  describe("when associating bsffs", () => {
    let emitter: UserWithCompany;
    let transporter: UserWithCompany;
    let destination: UserWithCompany;

    beforeEach(async () => {
      emitter = await userWithCompanyFactory(UserRole.ADMIN);
      transporter = await userWithCompanyFactory(UserRole.ADMIN);
      destination = await userWithCompanyFactory(UserRole.ADMIN);
    });

    it("should associate bsffs for groupement", async () => {
      const bsffToAssociate = await createBsffAfterOperation(
        { emitter, transporter, destination },
        {
          destinationOperationCode: OPERATION_CODES.R12
        }
      );

      const { mutate } = makeClient(destination.user);
      const { data } = await mutate<
        Pick<Mutation, "createBsff">,
        MutationCreateBsffArgs
      >(CREATE_BSFF, {
        variables: {
          input: {
            destination: {
              company: {
                name: destination.company.name,
                siret: destination.company.siret,
                address: destination.company.address,
                contact: destination.user.name,
                mail: destination.user.email
              }
            },
            bsffs: [bsffToAssociate.id]
          }
        }
      });

      const associatedBsffs = await prisma.bsff
        .findUnique({ where: { id: data.createBsff.id } })
        .bsffs();
      expect(associatedBsffs).toHaveLength(1);
    });

    it("should associate bsffs for réexpédition", async () => {
      const bsffToAssociate = await createBsffAfterOperation(
        { emitter, transporter, destination },
        {
          destinationOperationCode: null
        }
      );

      const { mutate } = makeClient(destination.user);
      const { data } = await mutate<
        Pick<Mutation, "createBsff">,
        MutationCreateBsffArgs
      >(CREATE_BSFF, {
        variables: {
          input: {
            destination: {
              company: {
                name: destination.company.name,
                siret: destination.company.siret,
                address: destination.company.address,
                contact: destination.user.name,
                mail: destination.user.email
              }
            },
            bsffs: [bsffToAssociate.id]
          }
        }
      });

      const associatedBsffs = await prisma.bsff
        .findUnique({ where: { id: data.createBsff.id } })
        .bsffs();
      expect(associatedBsffs).toHaveLength(1);
    });

    it("should disallow associating bsffs with missing signatures", async () => {
      const bsffs = await Promise.all([
        createBsffAfterEmission(
          { emitter, transporter, destination },
          {
            destinationOperationCode: OPERATION_CODES.R12
          }
        )
      ]);

      const { mutate } = makeClient(destination.user);
      const { errors } = await mutate<
        Pick<Mutation, "createBsff">,
        MutationCreateBsffArgs
      >(CREATE_BSFF, {
        variables: {
          input: {
            destination: {
              company: {
                name: destination.company.name,
                siret: destination.company.siret,
                address: destination.company.address,
                contact: destination.user.name,
                mail: destination.user.email
              }
            },
            bsffs: bsffs.map(bsff => bsff.id)
          }
        }
      });

      expect(errors).toEqual([
        expect.objectContaining({
          message: `Certains des bordereaux à associer n'ont pas toutes les signatures requises`
        })
      ]);
    });
  });
});
