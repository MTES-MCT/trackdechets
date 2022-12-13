import {
  UserRole,
  BsffType,
  BsffStatus,
  BsffPackagingType
} from "@prisma/client";
import { gql } from "apollo-server-core";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { BSFF_WASTE_CODES } from "../../../../common/constants";
import {
  Mutation,
  MutationUpdateBsffArgs
} from "../../../../generated/graphql/types";
import prisma from "../../../../prisma";
import { associateUserToCompany } from "../../../../users/database";
import {
  companyFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { OPERATION } from "../../../constants";
import { getPreviousPackagings } from "../../../database";
import { fullBsff } from "../../../fragments";
import {
  createBsff,
  createBsffAfterEmission,
  createBsffAfterOperation,
  createBsffAfterTransport,
  createBsffBeforeEmission,
  createFicheIntervention
} from "../../../__tests__/factories";

const UPDATE_BSFF = gql`
  mutation UpdateBsff($id: ID!, $input: BsffInput!) {
    updateBsff(id: $id, input: $input) {
      ...FullBsff
    }
  }
  ${fullBsff}
`;

describe("Mutation.updateBsff", () => {
  afterEach(resetDatabase);

  it("should allow user to update a bsff", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const bsff = await createBsff({ emitter }, { isDraft: true });

    const { mutate } = makeClient(emitter.user);
    const { data, errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input: {
          emitter: {
            company: {
              name: "New Name"
            }
          }
        }
      }
    });

    expect(errors).toBeUndefined();
    expect(data.updateBsff.id).toBeTruthy();
  });

  it("should allow user to update a bsff packagings", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const bsff = await createBsff(
      { emitter },
      {
        packagings: {
          create: { type: BsffPackagingType.BOUTEILLE, weight: 1, numero: "1" }
        },
        isDraft: true
      }
    );

    let packagings = await prisma.bsff
      .findUnique({ where: { id: bsff.id } })
      .packagings();

    expect(packagings.length).toEqual(1);

    const { mutate } = makeClient(emitter.user);
    const { data } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input: {
          packagings: [
            {
              type: BsffPackagingType.BOUTEILLE,
              weight: 1,
              numero: "2",
              volume: 1
            },
            {
              type: BsffPackagingType.BOUTEILLE,
              weight: 1,
              numero: "3",
              volume: 1
            }
          ]
        }
      }
    });

    packagings = await prisma.bsff
      .findUnique({ where: { id: bsff.id } })
      .packagings();

    expect(packagings.length).toEqual(2); // previous packagings should be deleted
    expect(packagings[0].numero).toEqual("2");
    expect(packagings[1].numero).toEqual("3");
    expect(data.updateBsff.packagings).toEqual([
      expect.objectContaining({ name: "BOUTEILLE", weight: 1, numero: "2" }),
      expect.objectContaining({ name: "BOUTEILLE", weight: 1, numero: "3" })
    ]);
  });

  it("should disallow unauthenticated user from updating a bsff", async () => {
    const { mutate } = makeClient();
    const { errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: "123",
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
    const bsff = await createBsff({});

    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input: {}
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Vous ne pouvez pas éditer un bordereau sur lequel le SIRET de votre entreprise n'apparaît pas."
      })
    ]);
  });

  it("should throw an error if the bsff being updated doesn't exist", async () => {
    const { user } = await userWithCompanyFactory(UserRole.ADMIN);

    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: "123",
        input: {}
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: "Le BSFF n°123 n'existe pas."
      })
    ]);
  });

  it("should throw an error if the bsff being updated is deleted", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const bsff = await createBsff({ emitter }, { isDeleted: true });

    const { mutate } = makeClient(emitter.user);
    const { errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input: {
          emitter: {
            company: {
              name: emitter.company.name
            }
          }
        }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: `Le BSFF n°${bsff.id} n'existe pas.`
      })
    ]);
  });

  it("prevent user from removing their own company from the bsff", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const bsff = await createBsff({ emitter }, { isDraft: true });

    const { mutate } = makeClient(emitter.user);
    const { errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input: {
          emitter: {
            company: {
              siret: "2".repeat(14)
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

  it("should allow updating emitter if they didn't sign", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const transporter = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);
    const bsff = await createBsffBeforeEmission({
      emitter,
      transporter,
      destination
    });

    const { mutate } = makeClient(emitter.user);

    const input = {
      emitter: {
        company: {
          name: "Another name"
        }
      }
    };
    const { data, errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input
      }
    });

    expect(errors).toBeUndefined();
    expect(data.updateBsff.emitter.company).toEqual(
      expect.objectContaining({ name: input.emitter.company.name })
    );
  });

  it("should not update emitter if they signed already", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const transporter = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);
    const bsff = await createBsffAfterEmission({
      emitter,
      transporter,
      destination
    });

    const { mutate } = makeClient(emitter.user);

    const input = {
      emitter: {
        company: {
          name: "Another name"
        }
      }
    };
    const { data, errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input
      }
    });

    expect(errors).toBeUndefined();
    expect(data.updateBsff.emitter.company).toEqual(
      expect.objectContaining({
        name: bsff.emitterCompanyName
      })
    );
  });

  it("should allow updating waste and quantity if emitter didn't sign", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const transporter = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);
    const bsff = await createBsffBeforeEmission({
      emitter,
      transporter,
      destination
    });

    const { mutate } = makeClient(emitter.user);

    const input = {
      waste: {
        code: BSFF_WASTE_CODES[0],
        description: "R10",
        adr: "Mention ADR"
      },
      weight: {
        value: 1,
        isEstimate: false
      }
    };
    const { data, errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input
      }
    });

    expect(errors).toBeUndefined();
    expect(data.updateBsff).toEqual(expect.objectContaining(input));
  });

  it("should not update waste and quantity if emitter signed already", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const transporter = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);
    const bsff = await createBsffAfterEmission({
      emitter,
      transporter,
      destination
    });

    const { mutate } = makeClient(emitter.user);

    const input = {
      waste: {
        code: BSFF_WASTE_CODES[0],
        description: "R10",
        adr: "Mention ADR"
      },
      weight: {
        value: 6,
        isEstimate: false
      }
    };
    const { data, errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input
      }
    });

    expect(errors).toBeUndefined();
    expect(data.updateBsff).toEqual(
      expect.objectContaining({
        waste: {
          code: bsff.wasteCode,
          description: bsff.wasteDescription,
          adr: input.waste.adr
        },
        weight: {
          value: bsff.weightValue,
          isEstimate: bsff.weightIsEstimate
        }
      })
    );
  });

  it("should allow updating transporter if they didn't sign", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const transporter = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);
    const bsff = await createBsffAfterEmission({
      emitter,
      transporter,
      destination
    });

    const { mutate } = makeClient(emitter.user);

    const input = {
      transporter: {
        company: {
          name: "Another name"
        }
      }
    };
    const { data, errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input
      }
    });

    expect(errors).toBeUndefined();
    expect(data.updateBsff.transporter.company).toEqual(
      expect.objectContaining(input.transporter.company)
    );
  });

  it("should not update transporter if they signed already", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const transporter = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);
    const bsff = await createBsffAfterTransport({
      emitter,
      transporter,
      destination
    });

    const { mutate } = makeClient(emitter.user);

    const input = {
      transporter: {
        company: {
          name: "Another name"
        }
      }
    };
    const { data, errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input
      }
    });

    expect(errors).toBeUndefined();
    expect(data.updateBsff.transporter.company).toEqual(
      expect.objectContaining({
        name: bsff.transporterCompanyName
      })
    );
  });

  it("should allow updating destination if they didn't sign", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const transporter = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);
    const bsff = await createBsffAfterTransport({
      emitter,
      transporter,
      destination
    });

    const { mutate } = makeClient(emitter.user);

    const input = {
      destination: {
        company: {
          name: "Another name"
        }
      }
    };
    const { data, errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input
      }
    });

    expect(errors).toBeUndefined();
    expect(data.updateBsff.destination.company).toEqual(
      expect.objectContaining({ name: input.destination.company.name })
    );
  });

  it("should not update a transporter if signed already", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const transporter = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);
    const bsff = await createBsffAfterTransport({
      emitter,
      transporter,
      destination
    });

    const { mutate } = makeClient(emitter.user);

    const input = {
      transporter: {
        company: {
          name: "Another name"
        }
      }
    };
    const { data, errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input
      }
    });

    expect(errors).toBeUndefined();
    expect(data.updateBsff.transporter.company).toEqual(
      expect.objectContaining({
        name: bsff.transporterCompanyName
      })
    );
  });

  it("should update the list of grouped BSFFs", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);

    const oldGroupingBsffs = await Promise.all([
      createBsffAfterOperation(
        {
          emitter: await userWithCompanyFactory(UserRole.ADMIN),
          transporter: await userWithCompanyFactory(UserRole.ADMIN),
          destination: emitter
        },
        {
          status: BsffStatus.INTERMEDIATELY_PROCESSED
        },
        { operationCode: OPERATION.R12.code }
      )
    ]);
    const newGroupingBsffs = await Promise.all([
      createBsffAfterOperation(
        {
          emitter: await userWithCompanyFactory(UserRole.ADMIN),
          transporter: await userWithCompanyFactory(UserRole.ADMIN),
          destination: emitter
        },
        {
          status: BsffStatus.INTERMEDIATELY_PROCESSED
        },
        { operationCode: OPERATION.R12.code }
      )
    ]);

    const bsff = await createBsffBeforeEmission(
      {
        emitter,
        transporter: await userWithCompanyFactory(UserRole.ADMIN),
        destination: await userWithCompanyFactory(UserRole.ADMIN),
        previousPackagings: oldGroupingBsffs.flatMap(bsff => bsff.packagings)
      },
      {
        type: BsffType.GROUPEMENT
      }
    );

    const { mutate } = makeClient(emitter.user);
    const { errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input: {
          grouping: newGroupingBsffs.flatMap(({ packagings }) =>
            packagings.map(p => p.id)
          )
        }
      }
    });

    expect(errors).toBeUndefined();

    const updatedBsff = await prisma.bsff.findUnique({
      where: { id: bsff.id },
      include: { packagings: true }
    });

    const previousPackagings = await getPreviousPackagings(
      updatedBsff.packagings.map(p => p.id),
      1
    );

    for (const packaging of previousPackagings) {
      expect(
        newGroupingBsffs.flatMap(bsff => bsff.packagings.map(p => p.id))
      ).toContain(packaging.id);
    }
  });

  it("should update the forwarded BSFF", async () => {
    const ttr = await userWithCompanyFactory(UserRole.ADMIN);
    const oldForwarded = await createBsffAfterOperation(
      {
        emitter: await userWithCompanyFactory(UserRole.ADMIN),
        transporter: await userWithCompanyFactory(UserRole.ADMIN),
        destination: ttr
      },
      {
        status: BsffStatus.INTERMEDIATELY_PROCESSED
      },
      { operationCode: OPERATION.R13.code }
    );

    const bsff = await createBsffBeforeEmission(
      {
        emitter: ttr,
        transporter: await userWithCompanyFactory(UserRole.ADMIN),
        destination: await userWithCompanyFactory(UserRole.ADMIN),
        previousPackagings: oldForwarded.packagings
      },
      {
        type: BsffType.REEXPEDITION
      }
    );

    const newForwarded = await createBsffAfterOperation(
      {
        emitter: await userWithCompanyFactory(UserRole.ADMIN),
        transporter: await userWithCompanyFactory(UserRole.ADMIN),
        destination: ttr
      },
      {
        status: BsffStatus.INTERMEDIATELY_PROCESSED
      },
      { operationCode: OPERATION.R13.code }
    );

    const { mutate } = makeClient(ttr.user);
    const { errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input: {
          forwarding: newForwarded.packagings.map(p => p.id)
        }
      }
    });

    expect(errors).toBeUndefined();

    const updatedBsff = await prisma.bsff.findUnique({
      where: { id: bsff.id },
      include: { packagings: true }
    });

    const previousPackagings = await getPreviousPackagings(
      updatedBsff.packagings.map(p => p.id),
      1
    );
    expect(previousPackagings).toHaveLength(1);

    expect(previousPackagings[0].id).toEqual(newForwarded.packagings[0].id);
  });

  it("should update the list of repackaged BSFF", async () => {
    const ttr = await userWithCompanyFactory(UserRole.ADMIN);
    const oldRepackaged = await createBsffAfterOperation(
      {
        emitter: await userWithCompanyFactory(UserRole.ADMIN),
        transporter: await userWithCompanyFactory(UserRole.ADMIN),
        destination: ttr
      },
      {
        status: BsffStatus.INTERMEDIATELY_PROCESSED
      },
      { operationCode: OPERATION.D14.code }
    );

    const bsff = await createBsffBeforeEmission(
      {
        emitter: ttr,
        transporter: await userWithCompanyFactory(UserRole.ADMIN),
        destination: await userWithCompanyFactory(UserRole.ADMIN),
        previousPackagings: oldRepackaged.packagings
      },
      {
        type: BsffType.RECONDITIONNEMENT,
        packagings: {
          create: {
            type: BsffPackagingType.BOUTEILLE,
            numero: "numero",
            volume: 1,
            weight: 1,
            previousPackagings: {
              connect: oldRepackaged.packagings.map(p => ({ id: p.id }))
            }
          }
        }
      }
    );

    const newRepackaged = await createBsffAfterOperation(
      {
        emitter: await userWithCompanyFactory(UserRole.ADMIN),
        transporter: await userWithCompanyFactory(UserRole.ADMIN),
        destination: ttr
      },
      {
        status: BsffStatus.INTERMEDIATELY_PROCESSED
      },
      { operationCode: OPERATION.D14.code }
    );

    const { mutate } = makeClient(ttr.user);
    const { errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input: {
          repackaging: [newRepackaged.packagings[0].id]
        }
      }
    });

    expect(errors).toBeUndefined();

    const previousPackagings = await getPreviousPackagings(
      bsff.packagings.map(p => p.id),
      1
    );

    for (const previousPackaging of previousPackagings) {
      expect(newRepackaged.packagings.map(p => p.id)).toContain(
        previousPackaging.id
      );
    }
  });

  it("should change the initial transporter", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const transporter = await userWithCompanyFactory(UserRole.ADMIN);
    const otherTransporter = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);
    const bsff = await createBsffAfterEmission({
      emitter,
      transporter,
      destination
    });

    const { mutate } = makeClient(emitter.user);

    const input = {
      transporter: {
        company: {
          siret: otherTransporter.company.siret,
          name: otherTransporter.company.name
        }
      }
    };
    const { data, errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input
      }
    });

    expect(errors).toBeUndefined();
    expect(data.updateBsff.transporter.company).toEqual(
      expect.objectContaining(input.transporter.company)
    );
  });

  it("should update a bsff with previous bsffs", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const groupingBsffs = await Promise.all([
      createBsffAfterOperation(
        {
          emitter: await userWithCompanyFactory(UserRole.ADMIN),
          transporter: await userWithCompanyFactory(UserRole.ADMIN),
          destination: emitter
        },
        {
          status: BsffStatus.INTERMEDIATELY_PROCESSED
        },
        { operationCode: OPERATION.R12.code }
      )
    ]);
    const bsff = await createBsffBeforeEmission(
      {
        emitter,
        previousPackagings: groupingBsffs.flatMap(bsff => bsff.packagings)
      },
      {
        type: BsffType.GROUPEMENT,
        isDraft: true
      }
    );

    const { mutate } = makeClient(emitter.user);
    const { data, errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input: {
          emitter: {
            company: {
              name: "New Name"
            }
          }
        }
      }
    });

    expect(errors).toBeUndefined();
    expect(data.updateBsff.id).toBeTruthy();
  });

  it("should update a bsff with a forwarding BSFF", async () => {
    const ttr = await userWithCompanyFactory(UserRole.ADMIN);
    const forwardedBsff = await createBsffAfterOperation(
      {
        emitter: await userWithCompanyFactory(UserRole.ADMIN),
        transporter: await userWithCompanyFactory(UserRole.ADMIN),
        destination: ttr
      },
      {
        status: BsffStatus.INTERMEDIATELY_PROCESSED
      },
      { operationCode: OPERATION.R13.code }
    );
    const bsff = await createBsffBeforeEmission(
      { emitter: ttr, previousPackagings: forwardedBsff.packagings },
      {
        type: BsffType.REEXPEDITION,
        isDraft: true
      }
    );

    const { mutate } = makeClient(ttr.user);
    const { data, errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input: {
          emitter: {
            company: {
              name: "New Name"
            }
          }
        }
      }
    });

    expect(errors).toBeUndefined();
    expect(data.updateBsff.id).toBeTruthy();
  });

  it("should be possible to update a bsff's fiches d'intervention", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const detenteur1 = await userWithCompanyFactory(UserRole.ADMIN);
    const detenteur2 = await userWithCompanyFactory(UserRole.ADMIN);

    const ficheInterventions = await Promise.all([
      createFicheIntervention({
        operateur: emitter,
        detenteur: detenteur1
      })
    ]);
    const bsff = await createBsffBeforeEmission(
      { emitter },
      {
        isDraft: true,
        type: "COLLECTE_PETITES_QUANTITES",
        detenteurCompanySirets: [detenteur1.company.siret],
        ficheInterventions: {
          connect: ficheInterventions.map(({ id }) => ({ id }))
        }
      }
    );

    const ficheIntervention = await createFicheIntervention({
      operateur: emitter,
      detenteur: detenteur2
    });

    const { mutate } = makeClient(emitter.user);
    const { errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input: {
          ficheInterventions: [ficheIntervention.id]
        }
      }
    });

    expect(errors).toBeUndefined();
    const updatedBsff = await prisma.bsff.findUnique({
      where: { id: bsff.id },
      include: { ficheInterventions: true }
    });
    expect(updatedBsff.ficheInterventions).toEqual([
      expect.objectContaining({ id: ficheIntervention.id })
    ]);
    expect(updatedBsff.detenteurCompanySirets).toEqual([
      detenteur2.company.siret
    ]);
  });

  it("should not be possible to update BSFF type", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const bsff = await createBsffBeforeEmission(
      { emitter },
      {
        type: BsffType.GROUPEMENT,
        isDraft: true
      }
    );
    const { mutate } = makeClient(emitter.user);
    const { errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input: {
          type: BsffType.COLLECTE_PETITES_QUANTITES
        }
      }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message: "Vous ne pouvez pas modifier le type de BSFF après création"
      })
    ]);
  });

  it("should not be possible to update emitter when grouping, repackaging or forwarding", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const otherCompany = await companyFactory();
    await associateUserToCompany(
      emitter.user.id,
      otherCompany.siret,
      UserRole.ADMIN
    );
    const bsff = await createBsffBeforeEmission(
      { emitter },
      {
        type: BsffType.GROUPEMENT,
        isDraft: true
      }
    );
    const { mutate } = makeClient(emitter.user);
    const { errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input: {
          emitter: { company: { siret: otherCompany.siret } }
        }
      }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Vous ne pouvez pas modifier l'établissement émetteur après création du BSFF en cas de réexpédition, groupement ou reconditionnement"
      })
    ]);
  });
});
