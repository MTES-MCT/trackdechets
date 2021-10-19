import { UserRole } from "@prisma/client";
import { resetDatabase } from "../../../../../integration-tests/helper";
import {
  Mutation,
  MutationUpdateBsdaArgs
} from "../../../../generated/graphql/types";
import prisma from "../../../../prisma";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { bsdaFactory } from "../../../__tests__/factories";

const UPDATE_BSDA = `
  mutation UpdateBsda($id: ID!, $input: BsdaInput!) {
    updateBsda(id: $id, input: $input) {
      id
      emitter {
        company {
          name
        }
      }
      waste {
        code
      }
      transporter {
        company {
          name
        }
        recepisse {
          number
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

describe("Mutation.updateBsda", () => {
  afterEach(resetDatabase);

  it("should allow user to update a bsda", async () => {
    const { company, user } = await userWithCompanyFactory(UserRole.ADMIN);
    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: company.siret
      }
    });

    const { mutate } = makeClient(user);
    const { data } = await mutate<
      Pick<Mutation, "updateBsda">,
      MutationUpdateBsdaArgs
    >(UPDATE_BSDA, {
      variables: {
        id: bsda.id,
        input: {
          emitter: {
            company: {
              name: "New Name"
            }
          }
        }
      }
    });

    expect(data.updateBsda.id).toBeTruthy();
  });

  it("should disallow unauthenticated user from updating a bsda", async () => {
    const { mutate } = makeClient();
    const { errors } = await mutate<
      Pick<Mutation, "updateBsda">,
      MutationUpdateBsdaArgs
    >(UPDATE_BSDA, {
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

  it("should disallow user that is not a contributor on the bsda", async () => {
    const { user } = await userWithCompanyFactory(UserRole.ADMIN);
    const bsda = await bsdaFactory({
      opt: {}
    });

    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "updateBsda">,
      MutationUpdateBsdaArgs
    >(UPDATE_BSDA, {
      variables: {
        id: bsda.id,
        input: {}
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Vous ne pouvez pas modifier un bordereau sur lequel votre entreprise n'apparait pas"
      })
    ]);
  });

  it("should throw an error if the bsda being updated doesn't exist", async () => {
    const { user } = await userWithCompanyFactory(UserRole.ADMIN);

    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "updateBsda">,
      MutationUpdateBsdaArgs
    >(UPDATE_BSDA, {
      variables: {
        id: "123",
        input: {}
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: `Le bordereau avec l'identifiant "123" n'existe pas.`
      })
    ]);
  });

  it("should throw an error if the bsda being updated is deleted", async () => {
    const { company, user } = await userWithCompanyFactory(UserRole.ADMIN);
    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: company.siret,
        isDeleted: true
      }
    });

    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "updateBsda">,
      MutationUpdateBsdaArgs
    >(UPDATE_BSDA, {
      variables: {
        id: bsda.id,
        input: {
          emitter: {
            company: {
              name: company.name
            }
          }
        }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: `Le bordereau avec l'identifiant "${bsda.id}" n'existe pas.`
      })
    ]);
  });

  it("should disallow removing a company from the bsda", async () => {
    const { company, user } = await userWithCompanyFactory(UserRole.ADMIN);
    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: company.siret
      }
    });

    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "updateBsda">,
      MutationUpdateBsdaArgs
    >(UPDATE_BSDA, {
      variables: {
        id: bsda.id,
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
        message: "Vous ne pouvez pas enlever votre établissement du bordereau"
      })
    ]);
  });

  it("should allow updating emitter if they didn't sign", async () => {
    const { company, user } = await userWithCompanyFactory(UserRole.ADMIN);
    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: company.siret
      }
    });

    const { mutate } = makeClient(user);

    const input = {
      emitter: {
        company: {
          name: "Another name"
        }
      }
    };
    const { data } = await mutate<
      Pick<Mutation, "updateBsda">,
      MutationUpdateBsdaArgs
    >(UPDATE_BSDA, {
      variables: {
        id: bsda.id,
        input
      }
    });

    expect(data.updateBsda).toEqual(expect.objectContaining(input));
  });

  it("should not update emitter if they signed already", async () => {
    const { company, user } = await userWithCompanyFactory(UserRole.ADMIN);
    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: company.siret,
        emitterEmissionSignatureDate: new Date()
      }
    });

    const { mutate } = makeClient(user);

    const input = {
      emitter: {
        company: {
          name: "Another name"
        }
      }
    };
    const { errors } = await mutate<
      Pick<Mutation, "updateBsda">,
      MutationUpdateBsdaArgs
    >(UPDATE_BSDA, {
      variables: {
        id: bsda.id,
        input
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Des champs ont été vérouillés via signature et ne peuvent plus être modifiés: emitter.company.name"
      })
    ]);
  });

  it("should allow updating transporter if they didn't sign", async () => {
    const { company, user } = await userWithCompanyFactory(UserRole.ADMIN);
    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: company.siret,
        emitterEmissionSignatureDate: new Date()
      }
    });

    const { mutate } = makeClient(user);

    const input = {
      transporter: {
        recepisse: {
          number: "Num recepisse"
        }
      }
    };
    const { data } = await mutate<
      Pick<Mutation, "updateBsda">,
      MutationUpdateBsdaArgs
    >(UPDATE_BSDA, {
      variables: {
        id: bsda.id,
        input
      }
    });

    expect(data.updateBsda.transporter.recepisse.number).toEqual(
      "Num recepisse"
    );
  });

  it("should not update transporter if they signed already", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const transporter = await userWithCompanyFactory(UserRole.ADMIN);
    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: emitter.company.siret,
        transporterCompanySiret: transporter.company.siret,
        emitterEmissionSignatureDate: new Date(),
        transporterTransportSignatureDate: new Date()
      }
    });

    const { mutate } = makeClient(emitter.user);

    const input = {
      transporter: {
        company: {
          name: "Another name"
        }
      }
    };
    const { errors } = await mutate<
      Pick<Mutation, "updateBsda">,
      MutationUpdateBsdaArgs
    >(UPDATE_BSDA, {
      variables: {
        id: bsda.id,
        input
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Des champs ont été vérouillés via signature et ne peuvent plus être modifiés: transporter.company.name"
      })
    ]);
  });

  it("should update the list of grouped bsdas", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const transporter = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);

    const associatedBsda = await bsdaFactory({
      opt: {
        status: "AWAITING_CHILD",
        emitterCompanySiret: emitter.company.siret,
        destinationCompanySiret: destination.company.siret,
        transporterCompanySiret: transporter.company.siret,
        destinationOperationCode: "D 13"
      }
    });
    const bsdaToGroup = await bsdaFactory({
      opt: {
        type: "RESHIPMENT",
        status: "AWAITING_CHILD",
        emitterCompanySiret: emitter.company.siret,
        destinationCompanySiret: destination.company.siret,
        transporterCompanySiret: transporter.company.siret,
        destinationOperationCode: "D 13"
      }
    });

    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: destination.company.siret,
        grouping: { connect: [{ id: associatedBsda.id }] }
      }
    });

    const { mutate } = makeClient(destination.user);
    const { data } = await mutate<
      Pick<Mutation, "updateBsda">,
      MutationUpdateBsdaArgs
    >(UPDATE_BSDA, {
      variables: {
        id: bsda.id,
        input: {
          grouping: [bsdaToGroup.id]
        }
      }
    });

    const groupedBsdas = await prisma.bsda
      .findUnique({ where: { id: data.updateBsda.id } })
      .grouping();
    expect(groupedBsdas).toEqual([
      expect.objectContaining({
        id: bsdaToGroup.id
      })
    ]);
  });

  it("should update the forwarded BSDA", async () => {
    const ttr = await userWithCompanyFactory(UserRole.ADMIN);
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const transporter = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);

    const oldForwarded = await bsdaFactory({
      opt: {
        status: "AWAITING_CHILD",
        emitterCompanySiret: emitter.company.siret,
        destinationCompanySiret: destination.company.siret,
        transporterCompanySiret: transporter.company.siret,
        destinationOperationCode: "D 13"
      }
    });

    const bsda = await bsdaFactory({
      opt: {
        status: "INITIAL",
        emitterCompanySiret: ttr.company.siret,
        destinationCompanySiret: destination.company.siret,
        transporterCompanySiret: transporter.company.siret,
        destinationOperationCode: "D 13",
        forwarding: { connect: { id: oldForwarded.id } }
      }
    });

    const newForwarded = await bsdaFactory({
      opt: {
        status: "AWAITING_CHILD",
        emitterCompanySiret: emitter.company.siret,
        destinationCompanySiret: ttr.company.siret,
        transporterCompanySiret: transporter.company.siret,
        destinationOperationCode: "D 13"
      }
    });

    const { mutate } = makeClient(ttr.user);
    const { errors } = await mutate<
      Pick<Mutation, "updateBsda">,
      MutationUpdateBsdaArgs
    >(UPDATE_BSDA, {
      variables: {
        id: bsda.id,
        input: {
          forwarding: newForwarded.id
        }
      }
    });

    expect(errors).toBeUndefined();

    const actualForwarded = await prisma.bsda
      .findUnique({ where: { id: bsda.id } })
      .forwarding();

    expect(actualForwarded.id).toEqual(newForwarded.id);
  });
});
