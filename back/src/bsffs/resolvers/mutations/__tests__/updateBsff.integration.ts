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
  BsffOperationCode,
  Mutation,
  MutationUpdateBsffArgs
} from "../../../../generated/graphql/types";
import prisma from "../../../../prisma";
import { associateUserToCompany } from "../../../../users/database";
import {
  companyFactory,
  siretify,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { OPERATION } from "../../../constants";
import { fullBsff } from "../../../fragments";
import { getReadonlyBsffPackagingRepository } from "../../../repository";
import {
  createBsff,
  createBsffAfterEmission,
  createBsffAfterOperation,
  createBsffAfterTransport,
  createBsffBeforeEmission,
  createBsffAfterReception,
  createFicheIntervention
} from "../../../__tests__/factories";
import * as sirenify from "../../../sirenify";

const sirenifyMock = jest
  .spyOn(sirenify, "sirenifyBsffInput")
  .mockImplementation(input => Promise.resolve(input));

const UPDATE_BSFF = gql`
  mutation UpdateBsff($id: ID!, $input: BsffInput!) {
    updateBsff(id: $id, input: $input) {
      ...FullBsff
    }
  }
  ${fullBsff}
`;

describe("Mutation.updateBsff", () => {
  afterEach(async () => {
    await resetDatabase();
    sirenifyMock.mockClear();
  });

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
    // check input is sirenified
    expect(sirenifyMock).toHaveBeenCalledTimes(1);
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
              siret: siretify(2)
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

  test("before emitter signature > it should be possible to update any field", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const transporter = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);
    const bsff = await createBsffBeforeEmission({ emitter });
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
              name: emitter.company.name,
              siret: emitter.company.siret,
              address: emitter.company.address,
              contact: emitter.user.name,
              mail: emitter.user.email,
              phone: emitter.company.contactPhone
            }
          },
          transporter: {
            company: {
              name: transporter.company.name,
              siret: transporter.company.siret,
              address: transporter.company.address,
              contact: transporter.user.name,
              mail: transporter.user.email,
              phone: transporter.company.contactPhone
            }
          },
          destination: {
            company: {
              name: destination.company.name,
              siret: destination.company.siret,
              address: destination.company.address,
              contact: destination.user.name,
              mail: destination.user.email,
              phone: destination.company.contactPhone
            },
            plannedOperationCode: "R12" as BsffOperationCode
          },
          waste: {
            code: BSFF_WASTE_CODES[0],
            adr: "Mention ADR",
            description: "R410"
          },
          weight: {
            value: 1,
            isEstimate: true
          },
          packagings: [
            {
              type: BsffPackagingType.BOUTEILLE,
              numero: "123",
              weight: 1,
              volume: 1
            }
          ]
        }
      }
    });
    expect(errors).toBeUndefined();
  });

  test("after emitter signature > it should not be possible to update sealed fields", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const transporter = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);

    const bsff = await createBsffAfterEmission({ emitter, destination });
    const { mutate } = makeClient(destination.user);
    const { errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input: {
          emitter: {
            company: {
              name: "Émetteur 2",
              siret: emitter.company.siret,
              address: "Adresse 2",
              contact: "Contact 2",
              mail: "Email 2",
              phone: "0202020202"
            }
          },
          transporter: {
            company: {
              name: "Transporteur 2",
              siret: transporter.company.siret,
              address: "Adresse 2",
              contact: "Contact 2",
              mail: "Email 2",
              phone: "0202020202"
            }
          },
          destination: {
            company: {
              name: "Destination 2",
              siret: destination.company.siret,
              address: "Adresse 2",
              contact: "COntact 2",
              mail: "Email 2",
              phone: "0202020202"
            },
            plannedOperationCode: "D10" as BsffOperationCode
          },
          waste: {
            code: "14 06 03*",
            adr: "ADR",
            description: "HFC"
          },
          weight: {
            value: 2,
            isEstimate: false
          },
          packagings: [
            {
              type: BsffPackagingType.CITERNE,
              numero: "updated-numero",
              weight: 1,
              volume: 1
            }
          ]
        }
      }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés :" +
          " emitterCompanyName, emitterCompanyAddress, emitterCompanyContact, emitterCompanyPhone," +
          " emitterCompanyMail, destinationCompanyName," +
          " destinationCompanyAddress, destinationCompanyContact, destinationCompanyPhone," +
          " destinationCompanyMail, wasteCode, wasteDescription, wasteAdr, weightValue"
      })
    ]);

    const updatedBsff = await prisma.bsff.findUnique({
      where: { id: bsff.id },
      include: { packagings: true }
    });

    // check packagings update has been ignored
    expect(updatedBsff.packagings[0].numero).toEqual("1234");
  });

  test("after emitter signature > it should be possible to update trasport fields", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const transporter = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);
    const bsff = await createBsffAfterEmission({
      emitter,
      transporter,
      destination
    });
    const { mutate } = makeClient(transporter.user);
    const { errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input: {
          transporter: {
            transport: {
              takenOverAt: "2022-11-02" as any,
              mode: "ROAD",
              plates: ["BG-007-FR"]
            }
          }
        }
      }
    });
    expect(errors).toBeUndefined();
  });

  test("after transporter signature > it should not be possible to update sealed fields", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const transporter = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);
    const bsff = await createBsffAfterTransport({
      emitter,
      transporter,
      destination
    });
    const { mutate } = makeClient(emitter.user);
    const { errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input: {
          transporter: {
            transport: {
              takenOverAt: "2022-11-02" as any,
              mode: "ROAD",
              plates: ["BG-007-FR"]
            }
          }
        }
      }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés :" +
          " transporterTransportPlates, transporterTransportTakenOverAt"
      })
    ]);
  });

  test("after transporter signature > it should be possible to update reception fields", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const transporter = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);
    const bsff = await createBsffAfterTransport({
      emitter,
      transporter,
      destination
    });
    const { mutate } = makeClient(transporter.user);
    const { errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input: {
          destination: {
            reception: {
              date: "2022-11-03" as any
            }
          }
        }
      }
    });
    expect(errors).toBeUndefined();
  });

  test("after reception signature > it should not be possible to update sealed fields", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const transporter = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);
    const bsff = await createBsffAfterReception({
      emitter,
      transporter,
      destination
    });
    const { mutate } = makeClient(emitter.user);
    const { errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input: {
          destination: {
            reception: {
              date: "2022-11-03" as any
            }
          }
        }
      }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés : destinationReceptionDate"
      })
    ]);
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

    const previousPackagings =
      await getReadonlyBsffPackagingRepository().findPreviousPackagings(
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

    const previousPackagings =
      await getReadonlyBsffPackagingRepository().findPreviousPackagings(
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

    const previousPackagings =
      await getReadonlyBsffPackagingRepository().findPreviousPackagings(
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

  it("should update a BSFF of type RECONDITIONNEMENT", async () => {
    const ttr = await userWithCompanyFactory(UserRole.ADMIN);
    const repackagingBsff = await createBsffAfterOperation(
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
      { emitter: ttr, previousPackagings: repackagingBsff.packagings },
      {
        type: BsffType.RECONDITIONNEMENT,
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
          destination: {
            cap: "nouveau cap"
          },
          packagings: [
            { numero: "citerne-1", type: "CITERNE", volume: 1, weight: 1 }
          ],
          repackaging: repackagingBsff.packagings.map(p => p.id)
        }
      }
    });

    expect(errors).toBeUndefined();
    expect(data.updateBsff.destination?.cap).toEqual("nouveau cap");
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
