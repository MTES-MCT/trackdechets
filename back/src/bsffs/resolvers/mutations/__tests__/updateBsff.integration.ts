import { UserRole, BsffStatus, BsffType } from "@prisma/client";
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
  createBsffAfterTransport
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
        nature
        adr
      }
      quantity {
        kilos
        isEstimate
      }
      transporter {
        company {
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
    const bsff = await createBsff({ emitter });

    const { mutate } = makeClient(emitter.user);
    const { data } = await mutate<
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
    const bsff = await createBsff();

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

  it("should disallow removing a company from the bsff", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const bsff = await createBsff({ emitter });

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
    const bsff = await createBsff({ emitter });

    const { mutate } = makeClient(emitter.user);

    const input = {
      emitter: {
        company: {
          name: "Another name"
        }
      }
    };
    const { data } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input
      }
    });

    expect(data.updateBsff).toEqual(expect.objectContaining(input));
  });

  it("should not update emitter if they signed already", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const bsff = await createBsffAfterEmission({ emitter });

    const { mutate } = makeClient(emitter.user);

    const input = {
      emitter: {
        company: {
          name: "Another name"
        }
      }
    };
    const { data } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input
      }
    });

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
    const bsff = await createBsff({ emitter });

    const { mutate } = makeClient(emitter.user);

    const input = {
      waste: {
        code: WASTE_CODES[0],
        nature: "R10",
        adr: "Mention ADR"
      },
      quantity: {
        kilos: 1,
        isEstimate: false
      }
    };
    const { data } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input
      }
    });

    expect(data.updateBsff).toEqual(expect.objectContaining(input));
  });

  it("should not update waste and quantity if emitter signed already", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const bsff = await createBsffAfterEmission({ emitter });

    const { mutate } = makeClient(emitter.user);

    const input = {
      waste: {
        code: WASTE_CODES[0],
        nature: "R10",
        adr: "Mention ADR"
      },
      quantity: {
        kilos: 6,
        isEstimate: false
      }
    };
    const { data } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input
      }
    });

    expect(data.updateBsff).toEqual(
      expect.objectContaining({
        waste: {
          code: bsff.wasteCode,
          nature: bsff.wasteNature,
          adr: input.waste.adr
        },
        quantity: {
          kilos: bsff.quantityKilos,
          isEstimate: bsff.quantityIsEstimate
        }
      })
    );
  });

  it("should allow updating transporter if they didn't sign", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const bsff = await createBsffAfterEmission({ emitter });

    const { mutate } = makeClient(emitter.user);

    const input = {
      transporter: {
        company: {
          name: "Another name"
        }
      }
    };
    const { data } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input
      }
    });

    expect(data.updateBsff).toEqual(expect.objectContaining(input));
  });

  it("should not update transporter if they signed already", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const transporter = await userWithCompanyFactory(UserRole.ADMIN);
    const bsff = await createBsffAfterTransport({ emitter, transporter });

    const { mutate } = makeClient(emitter.user);

    const input = {
      transporter: {
        company: {
          name: "Another name"
        }
      }
    };
    const { data } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input
      }
    });

    expect(data.updateBsff).toEqual(
      expect.objectContaining({
        transporter: {
          company: {
            name: bsff.transporterCompanyName
          }
        }
      })
    );
  });

  it("should allow updating destination if they didn't sign", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const transporter = await userWithCompanyFactory(UserRole.ADMIN);
    const bsff = await createBsffAfterTransport({ emitter, transporter });

    const { mutate } = makeClient(emitter.user);

    const input = {
      destination: {
        company: {
          name: "Another name"
        }
      }
    };
    const { data } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input
      }
    });

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

  it("should update the list of previous bsffs", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const transporter = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);

    const oldPreviousBsff = await createBsffAfterOperation(
      { emitter, transporter, destination },
      {
        destinationOperationCode: OPERATION.R12.code,
        status: BsffStatus.INTERMEDIATELY_PROCESSED
      }
    );
    const newPreviousBsff = await createBsffAfterOperation(
      { emitter, transporter, destination },
      {
        destinationOperationCode: OPERATION.R12.code,
        status: BsffStatus.INTERMEDIATELY_PROCESSED
      }
    );
    const bsff = await createBsff(
      { emitter },
      {
        type: BsffType.GROUPEMENT,
        previousBsffs: { connect: [{ id: oldPreviousBsff.id }] }
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
          previousBsffs: [newPreviousBsff.id]
        }
      }
    });

    expect(errors).toBeUndefined();

    const previousBsffs = await prisma.bsff
      .findUnique({ where: { id: data.updateBsff.id } })
      .previousBsffs();
    expect(previousBsffs).toEqual([
      expect.objectContaining({
        id: newPreviousBsff.id
      })
    ]);
  });
});
