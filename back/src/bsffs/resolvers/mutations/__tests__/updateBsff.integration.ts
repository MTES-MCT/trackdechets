import { UserRole, BsffType, BsffStatus } from "@prisma/client";
import { resetDatabase } from "../../../../../integration-tests/helper";
import {
  Mutation,
  MutationUpdateBsffArgs
} from "../../../../generated/graphql/types";
import prisma from "../../../../prisma";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { OPERATION, WASTE_CODES } from "../../../constants";
import {
  createBsff,
  createBsffAfterEmission,
  createBsffAfterOperation,
  createBsffAfterReception,
  createBsffAfterTransport,
  createBsffBeforeEmission,
  createFicheIntervention
} from "../../../__tests__/factories";

const UPDATE_BSFF = `
  mutation UpdateBsff($id: ID!, $input: BsffInput!) {
    updateBsff(id: $id, input: $input) {
      id
      emitter {
        company {
          name
        }
      }
      waste {
        code
        description
        adr
      }
      weight {
        value
        isEstimate
      }
      transporter {
        company {
          siret
          name
        }
      }
      destination {
        company {
          name
        }
      }
    }
  }
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
        message: "Le bordereau de fluides frigorigènes n°123 n'existe pas."
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
        message: `Le bordereau de fluides frigorigènes n°${bsff.id} n'existe pas.`
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
              siret: "1".repeat(14)
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
    expect(data.updateBsff).toEqual(expect.objectContaining(input));
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
    expect(data.updateBsff).toEqual(
      expect.objectContaining({
        emitter: {
          company: {
            name: bsff.emitterCompanyName
          }
        }
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
        code: WASTE_CODES[0],
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
        code: WASTE_CODES[0],
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
    expect(data.updateBsff).toEqual(expect.objectContaining(input));
  });

  it("should not update destination if they signed already", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const transporter = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);
    const bsff = await createBsffAfterReception({
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
    expect(data.updateBsff).toEqual(
      expect.objectContaining({
        destination: {
          company: {
            name: bsff.destinationCompanyName
          }
        }
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
          status: BsffStatus.INTERMEDIATELY_PROCESSED,
          destinationOperationCode: OPERATION.R12.code
        }
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
          status: BsffStatus.INTERMEDIATELY_PROCESSED,
          destinationOperationCode: OPERATION.R12.code
        }
      )
    ]);

    const bsff = await createBsffBeforeEmission(
      {
        emitter,
        transporter: await userWithCompanyFactory(UserRole.ADMIN),
        destination: await userWithCompanyFactory(UserRole.ADMIN)
      },
      {
        type: BsffType.GROUPEMENT,
        grouping: {
          connect: oldGroupingBsffs.map(bsff => ({
            id: bsff.id
          }))
        }
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
          grouping: newGroupingBsffs.map(({ id }) => id)
        }
      }
    });

    expect(errors).toBeUndefined();

    const actualGroupingBsffs = await prisma.bsff
      .findUnique({
        where: { id: data.updateBsff.id }
      })
      .grouping();
    expect(actualGroupingBsffs).toEqual(
      newGroupingBsffs.map(({ id }) => expect.objectContaining({ id }))
    );
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
        status: BsffStatus.INTERMEDIATELY_PROCESSED,
        destinationOperationCode: OPERATION.R13.code
      }
    );

    const bsff = await createBsffBeforeEmission(
      {
        emitter: ttr,
        transporter: await userWithCompanyFactory(UserRole.ADMIN),
        destination: await userWithCompanyFactory(UserRole.ADMIN)
      },
      {
        type: BsffType.REEXPEDITION,
        forwarding: { connect: { id: oldForwarded.id } }
      }
    );

    const newForwarded = await createBsffAfterOperation(
      {
        emitter: await userWithCompanyFactory(UserRole.ADMIN),
        transporter: await userWithCompanyFactory(UserRole.ADMIN),
        destination: ttr
      },
      {
        status: BsffStatus.INTERMEDIATELY_PROCESSED,
        destinationOperationCode: OPERATION.R13.code
      }
    );

    const { mutate } = makeClient(ttr.user);
    const { errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input: {
          forwarding: newForwarded.id
        }
      }
    });

    expect(errors).toBeUndefined();

    const actualForwarded = await prisma.bsff
      .findUnique({ where: { id: bsff.id } })
      .forwarding();

    expect(actualForwarded.id).toEqual(newForwarded.id);
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
        status: BsffStatus.INTERMEDIATELY_PROCESSED,
        destinationOperationCode: OPERATION.D14.code
      }
    );

    const bsff = await createBsffBeforeEmission(
      {
        emitter: ttr,
        transporter: await userWithCompanyFactory(UserRole.ADMIN),
        destination: await userWithCompanyFactory(UserRole.ADMIN)
      },
      {
        type: BsffType.RECONDITIONNEMENT,
        repackaging: { connect: [{ id: oldRepackaged.id }] }
      }
    );

    const newRepackaged = await createBsffAfterOperation(
      {
        emitter: await userWithCompanyFactory(UserRole.ADMIN),
        transporter: await userWithCompanyFactory(UserRole.ADMIN),
        destination: ttr
      },
      {
        status: BsffStatus.INTERMEDIATELY_PROCESSED,
        destinationOperationCode: OPERATION.D14.code
      }
    );

    const { mutate } = makeClient(ttr.user);
    const { errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input: {
          repackaging: [newRepackaged.id]
        }
      }
    });

    expect(errors).toBeUndefined();

    const actualRepackaged = await prisma.bsff
      .findUnique({ where: { id: bsff.id } })
      .repackaging();

    expect(actualRepackaged).toHaveLength(1);
    expect(actualRepackaged[0].id).toEqual(newRepackaged.id);
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
    expect(data.updateBsff).toEqual(expect.objectContaining(input));
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
          status: BsffStatus.INTERMEDIATELY_PROCESSED,
          destinationOperationCode: OPERATION.R12.code
        }
      )
    ]);
    const bsff = await createBsffBeforeEmission(
      { emitter },
      {
        type: BsffType.GROUPEMENT,
        grouping: { connect: groupingBsffs.map(({ id }) => ({ id })) }
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
        status: BsffStatus.INTERMEDIATELY_PROCESSED,
        destinationOperationCode: OPERATION.R13.code
      }
    );
    const bsff = await createBsffBeforeEmission(
      { emitter: ttr },
      {
        type: BsffType.REEXPEDITION,
        forwarding: { connect: { id: forwardedBsff.id } }
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

  it("should update a bsff with fiches d'intervention", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const ficheInterventions = await Promise.all([
      createFicheIntervention({
        operateur: emitter,
        detenteur: await userWithCompanyFactory(UserRole.ADMIN)
      })
    ]);
    const bsff = await createBsffBeforeEmission(
      { emitter },
      {
        ficheInterventions: {
          connect: ficheInterventions.map(({ id }) => ({ id }))
        }
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
});
