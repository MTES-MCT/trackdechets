import { UserRole, BsffStatus, BsffType } from "@prisma/client";
import { resetDatabase } from "../../../../../integration-tests/helper";
import {
  Mutation,
  MutationCreateDraftBsffArgs
} from "../../../../generated/graphql/types";
import {
  UserWithCompany,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { OPERATION } from "../../../constants";
import { getPreviousPackagings } from "../../../database";
import {
  createBsff,
  createBsffAfterEmission,
  createBsffAfterOperation,
  createBsffBeforeEmission,
  createFicheIntervention
} from "../../../__tests__/factories";
import prisma from "../../../../prisma";

const CREATE_DRAFT_BSFF = `
  mutation CreateDraftBsff($input: BsffInput!) {
    createDraftBsff(input: $input) {
      id
      ficheInterventions {
        id
      }
      packagings {
        id
      }
    }
  }
`;

describe("Mutation.createDraftBsff", () => {
  afterEach(resetDatabase);

  it.each(["emitter", "transporter", "destination"])(
    "should allow %p to create a bsff",
    async role => {
      const { user, company } = await userWithCompanyFactory(UserRole.ADMIN);
      const { mutate } = makeClient(user);
      const { data, errors } = await mutate<
        Pick<Mutation, "createDraftBsff">,
        MutationCreateDraftBsffArgs
      >(CREATE_DRAFT_BSFF, {
        variables: {
          input: {
            type: BsffType.COLLECTE_PETITES_QUANTITES,
            [role]: {
              company: {
                siret: company.siret
              }
            }
          }
        }
      });

      expect(errors).toBeUndefined();
      expect(data.createDraftBsff.id).toBeTruthy();
    }
  );

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
              siret: "2".repeat(14),
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

  it("should link a fiche intervention to several bsffs", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);

    const detenteur = await userWithCompanyFactory(UserRole.ADMIN);
    const ficheIntervention = await createFicheIntervention({
      operateur: emitter,
      detenteur
    });

    // Create a first bsff linked to this fiche intervention
    await createBsffBeforeEmission(
      { emitter },
      {
        ficheInterventions: {
          connect: {
            id: ficheIntervention.id
          }
        }
      }
    );

    const { mutate } = makeClient(emitter.user);
    const { data, errors } = await mutate<
      Pick<Mutation, "createDraftBsff">,
      MutationCreateDraftBsffArgs
    >(CREATE_DRAFT_BSFF, {
      variables: {
        input: {
          type: BsffType.COLLECTE_PETITES_QUANTITES,
          emitter: {
            company: {
              name: emitter.company.name,
              siret: emitter.company.siret,
              address: emitter.company.address,
              contact: emitter.user.name,
              mail: emitter.user.email
            }
          },
          ficheInterventions: [ficheIntervention.id]
        }
      }
    });

    expect(errors).toBeUndefined();
    expect(data.createDraftBsff.ficheInterventions).toHaveLength(1);
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
          status: BsffStatus.INTERMEDIATELY_PROCESSED
        },
        { operationCode: OPERATION.R12.code }
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
            grouping: previousBsff.packagings.map(p => p.id)
          }
        }
      });

      expect(errors).toBeUndefined();

      const previousPackagings = await getPreviousPackagings(
        data.createDraftBsff.packagings.map(p => p.id)
      );

      expect(previousPackagings).toHaveLength(previousBsff.packagings.length);

      for (const previousPackaging of previousPackagings) {
        expect(previousBsff.packagings.map(p => p.id)).toContain(
          previousPackaging.id
        );
      }
    });

    it("should add a bsff for réexpedition", async () => {
      const forwarded = await createBsffAfterOperation(
        { emitter, transporter, destination },
        {
          status: BsffStatus.INTERMEDIATELY_PROCESSED
        },
        { operationCode: OPERATION.R13.code }
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
            forwarding: [forwarded.packagings[0].id]
          }
        }
      });

      expect(errors).toBeUndefined();

      const previousPackagings = await getPreviousPackagings(
        data.createDraftBsff.packagings.map(p => p.id)
      );

      expect(previousPackagings).toHaveLength(1);
      expect(previousPackagings[0].id).toEqual(forwarded.packagings[0].id);
    });

    it("should ne be possible to add packagings from several BSFFs in case of réexpédition", async () => {
      const bsff1 = await createBsffAfterOperation(
        { emitter, transporter, destination },
        {
          status: BsffStatus.INTERMEDIATELY_PROCESSED
        },
        { operationCode: OPERATION.R13.code }
      );
      const bsff2 = await createBsffAfterOperation(
        { emitter, transporter, destination },
        {
          status: BsffStatus.INTERMEDIATELY_PROCESSED
        },
        { operationCode: OPERATION.R13.code }
      );
      const { mutate } = makeClient(destination.user);
      const { errors } = await mutate<
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
            forwarding: [
              ...bsff1.packagings.map(p => p.id),
              ...bsff2.packagings.map(p => p.id)
            ]
          }
        }
      });

      expect(errors).toEqual([
        expect.objectContaining({
          message:
            "Tous les contenants réexpédiés doivent apparaitre sur le même BSFF initial"
        })
      ]);
    });

    it("should add bsffs for repackaging", async () => {
      const previousBsffs = await Promise.all([
        createBsffAfterOperation(
          { emitter, transporter, destination },
          {
            status: BsffStatus.INTERMEDIATELY_PROCESSED
          },
          { operationCode: OPERATION.D14.code }
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
            packagings: [
              { name: "Bouteille", volume: 1, weight: 1, numero: "cont1" }
            ],
            repackaging: previousBsffs.flatMap(previousBsff =>
              previousBsff.packagings.map(p => p.id)
            )
          }
        }
      });

      expect(errors).toBeUndefined();

      const previousPackagings = await getPreviousPackagings(
        data.createDraftBsff.packagings.map(p => p.id)
      );

      expect(previousPackagings).toHaveLength(
        previousBsffs.flatMap(bsff => bsff.packagings).length
      );

      for (const previousPackaging of previousPackagings) {
        expect(
          previousBsffs.flatMap(bsff => bsff.packagings.map(p => p.id))
        ).toContain(previousPackaging.id);
      }
    });

    it("should disallow grouping bsffs with missing signatures", async () => {
      const previousBsffs = await Promise.all([
        createBsffAfterEmission({ emitter, transporter, destination })
      ]);

      const previousPackagings = previousBsffs.flatMap(bsff => bsff.packagings);

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
            grouping: previousPackagings.map(p => p.id)
          }
        }
      });

      expect(errors).toEqual([
        expect.objectContaining({
          message: previousPackagings
            .map(
              p =>
                `La signature de l'opération n'a pas encore été faite sur le contenant ${p.id} - ${p.numero}`
            )
            .join("\n")
        })
      ]);
    });

    it("should throw an error when emitter is not previous packagings' destination", async () => {
      const otherDestination = await userWithCompanyFactory(UserRole.ADMIN);
      const previousBsff = await createBsffAfterOperation(
        { emitter, transporter, destination: otherDestination },
        {
          status: BsffStatus.INTERMEDIATELY_PROCESSED
        },
        { operationCode: OPERATION.R12.code }
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
            grouping: previousBsff.packagings.map(p => p.id)
          }
        }
      });

      const previousPackaging = previousBsff.packagings[0];

      expect(errors).toEqual([
        expect.objectContaining({
          message: `Le BSFF ${previousBsff.id} sur lequel apparait le contenant ${previousPackaging.id} (${previousPackaging.numero}) n'a pas été traité sur l'installation émettrice du nouveau BSFF ${destination.company.siret}`
        })
      ]);
    });

    it("should throw an error if initial packaging has already been forwarded, grouped or repackaged", async () => {
      const anotherGroupingBsff = await createBsff({});

      const previousBsff1 = await createBsffAfterOperation(
        { emitter, transporter, destination },
        {
          status: BsffStatus.INTERMEDIATELY_PROCESSED
        },
        { operationCode: OPERATION.R12.code }
      );
      const previousBsff2 = await createBsffAfterOperation(
        { emitter, transporter, destination },
        {
          status: BsffStatus.INTERMEDIATELY_PROCESSED
        },
        { operationCode: OPERATION.R12.code }
      );
      const previousBsffs = [previousBsff1, previousBsff2];

      await prisma.bsffPackaging.update({
        where: { id: anotherGroupingBsff.packagings[0].id },
        data: {
          previousPackagings: {
            connect: previousBsff1.packagings.map(p => ({ id: p.id }))
          }
        }
      });

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
            grouping: previousBsffs.flatMap(previousBsff =>
              previousBsff.packagings.map(p => p.id)
            )
          }
        }
      });

      expect(errors).toEqual([
        expect.objectContaining({
          message: `Le contenant n°${previousBsff1.packagings[0].id} (${previousBsff1.packagings[0].numero}) a déjà été réexpédié, reconditionné ou groupé dans un autre BSFF.`
        })
      ]);
    });
  });
});
